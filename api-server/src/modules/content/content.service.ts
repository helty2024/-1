import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import type { Prisma } from '../../generated/prisma/client';
import { PublishStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContentPublishStatusInput,
  type SaveContentPageDto,
} from './dto/save-content-page.dto';

const detailInclude = {
  sections: {
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.ContentPageInclude;

type ContentPageRecord = Prisma.ContentPageGetPayload<{
  include: typeof detailInclude;
}>;

const statusMap = {
  draft: PublishStatus.DRAFT,
  published: PublishStatus.PUBLISHED,
  offline: PublishStatus.OFFLINE,
} as const;

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminPages() {
    const pages = await this.prisma.contentPage.findMany({
      where: { deletedAt: null },
      include: detailInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return pages.map((page) => this.serialize(page));
  }

  async getAdminPage(id: string) {
    return this.serialize(await this.findPage(id));
  }

  async getPublicPage(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED, deletedAt: null },
      include: detailInclude,
    });
    if (!page) throw new NotFoundException('内容页面不存在或尚未发布');
    return this.serialize(page);
  }

  async create(
    dto: SaveContentPageDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const exists = await this.prisma.contentPage.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (exists) throw new ConflictException('页面编码已存在');

    const page = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contentPage.create({
        data: {
          slug: dto.slug,
          pageType: dto.pageType,
          title: dto.title,
          subtitle: dto.subtitle,
          summary: dto.label,
          status: PublishStatus.DRAFT,
          sections: { create: this.buildSections(dto) },
        },
        include: detailInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: 'content_page_create',
          resource: 'content_page',
          resourceId: created.id,
          afterJson: { slug: dto.slug, title: dto.title, status: 'draft' },
          ...this.auditContext(request),
        },
      });
      return created;
    });
    return this.serialize(page);
  }

  async update(
    id: string,
    dto: SaveContentPageDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findPage(id);
    const duplicate = await this.prisma.contentPage.findFirst({
      where: { slug: dto.slug, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('页面编码已存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.contentSection.deleteMany({ where: { pageId: id } });
      await tx.contentPage.update({
        where: { id },
        data: {
          slug: dto.slug,
          pageType: dto.pageType,
          title: dto.title,
          subtitle: dto.subtitle,
          summary: dto.label,
          version: { increment: 1 },
          sections: { create: this.buildSections(dto) },
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: 'content_page_update',
          resource: 'content_page',
          resourceId: id,
          beforeJson: {
            slug: current.slug,
            title: current.title,
            version: current.version,
          },
          afterJson: {
            slug: dto.slug,
            title: dto.title,
            version: current.version + 1,
          },
          ...this.auditContext(request),
        },
      });
    });
    return this.getAdminPage(id);
  }

  async updateStatus(
    id: string,
    status: ContentPublishStatusInput,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findPage(id);
    const nextStatus = statusMap[status];
    if (current.status === nextStatus) return this.serialize(current);

    await this.prisma.$transaction([
      this.prisma.contentPage.update({
        where: { id },
        data: {
          status: nextStatus,
          publishedAt:
            nextStatus === PublishStatus.PUBLISHED ? new Date() : null,
          publishedById:
            nextStatus === PublishStatus.PUBLISHED ? adminUserId : null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'content_page_status_update',
          resource: 'content_page',
          resourceId: id,
          beforeJson: { status: current.status.toLowerCase() },
          afterJson: { status },
          ...this.auditContext(request),
        },
      }),
    ]);
    return this.getAdminPage(id);
  }

  async remove(id: string, adminUserId: string, request: RequestWithId) {
    const current = await this.findPage(id);
    await this.prisma.$transaction([
      this.prisma.contentPage.update({
        where: { id },
        data: { deletedAt: new Date(), status: PublishStatus.OFFLINE },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'content_page_delete',
          resource: 'content_page',
          resourceId: id,
          beforeJson: { slug: current.slug, title: current.title },
          ...this.auditContext(request),
        },
      }),
    ]);
    return { deleted: true };
  }

  private async findPage(id: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!page) throw new NotFoundException('内容页面不存在');
    return page;
  }

  private buildSections(
    dto: SaveContentPageDto,
  ): Prisma.ContentSectionCreateWithoutPageInput[] {
    const sections: Prisma.ContentSectionCreateWithoutPageInput[] = [
      {
        sectionKey: 'page_meta',
        sectionType: 'page_meta',
        title: dto.navTitle,
        subtitle: dto.label,
        configJson: this.toJson({
          coverImage: dto.coverImage ?? null,
          cardActionText: dto.cardActionText ?? null,
          primaryAction: dto.primaryAction ?? null,
          secondaryAction: dto.secondaryAction ?? null,
        }),
        sortOrder: 0,
      },
      {
        sectionKey: 'stats',
        sectionType: 'stats',
        configJson: this.toJson({ items: dto.stats }),
        sortOrder: 10,
      },
      ...dto.sections.map((section, index) => ({
        sectionKey: `content_${index + 1}`,
        sectionType: 'content_cards',
        title: section.title,
        body: section.body,
        configJson: this.toJson({
          image: section.image ?? null,
          showProductCards: section.showProductCards ?? null,
          actionText: section.actionText ?? null,
          actionUrl: section.actionUrl ?? null,
          actionTab: section.actionTab ?? false,
          secondaryActionText: section.secondaryActionText ?? null,
          secondaryActionUrl: section.secondaryActionUrl ?? null,
          secondaryActionTab: section.secondaryActionTab ?? false,
          cards: section.cards,
        }),
        sortOrder: 100 + index,
      })),
    ];

    if (dto.timeline.length) {
      sections.push({
        sectionKey: 'timeline',
        sectionType: 'timeline',
        title: '发展历程',
        configJson: this.toJson({ items: dto.timeline }),
        sortOrder: 500,
      });
    }
    if (dto.cases.length) {
      sections.push({
        sectionKey: 'cases',
        sectionType: 'cases',
        title: '合作案例',
        configJson: this.toJson({ items: dto.cases }),
        sortOrder: 510,
      });
    }
    if (dto.faq.length) {
      sections.push({
        sectionKey: 'faq',
        sectionType: 'faq',
        title: '常见问题',
        configJson: this.toJson({ items: dto.faq }),
        sortOrder: 520,
      });
    }
    return sections;
  }

  private serialize(page: ContentPageRecord) {
    const meta = page.sections.find(
      (section) => section.sectionType === 'page_meta',
    );
    const stats = page.sections.find(
      (section) => section.sectionType === 'stats',
    );
    const timeline = page.sections.find(
      (section) => section.sectionType === 'timeline',
    );
    const cases = page.sections.find(
      (section) => section.sectionType === 'cases',
    );
    const faq = page.sections.find((section) => section.sectionType === 'faq');
    const metaConfig = this.asObject(meta?.configJson);

    return {
      id: page.id,
      slug: page.slug,
      pageType: page.pageType,
      navTitle: meta?.title ?? page.title,
      label: meta?.subtitle ?? page.summary ?? page.pageType,
      title: page.title,
      subtitle: page.subtitle ?? '',
      coverImage:
        typeof metaConfig.coverImage === 'string' ? metaConfig.coverImage : '',
      cardActionText:
        typeof metaConfig.cardActionText === 'string'
          ? metaConfig.cardActionText
          : '',
      status: page.status.toLowerCase(),
      version: page.version,
      publishedAt: page.publishedAt,
      updatedAt: page.updatedAt,
      stats: this.readItems(stats?.configJson),
      sections: page.sections
        .filter((section) => section.sectionType === 'content_cards')
        .map((section) => {
          const config = this.asObject(section.configJson);
          return {
            title: section.title ?? '',
            body: section.body ?? '',
            image: typeof config.image === 'string' ? config.image : '',
            showProductCards: config.showProductCards === true,
            actionText:
              typeof config.actionText === 'string' ? config.actionText : '',
            actionUrl:
              typeof config.actionUrl === 'string' ? config.actionUrl : '',
            actionTab: config.actionTab === true,
            secondaryActionText:
              typeof config.secondaryActionText === 'string'
                ? config.secondaryActionText
                : '',
            secondaryActionUrl:
              typeof config.secondaryActionUrl === 'string'
                ? config.secondaryActionUrl
                : '',
            secondaryActionTab: config.secondaryActionTab === true,
            cards: this.readNamedArray(section.configJson, 'cards'),
          };
        }),
      timeline: this.readItems(timeline?.configJson),
      cases: this.readItems(cases?.configJson),
      faq: this.readItems(faq?.configJson),
      primaryAction: metaConfig.primaryAction ?? null,
      secondaryAction: metaConfig.secondaryAction ?? null,
    };
  }

  private readItems(value: unknown) {
    return this.readNamedArray(value, 'items');
  }

  private readNamedArray(value: unknown, key: string): unknown[] {
    const object = this.asObject(value);
    return Array.isArray(object[key]) ? object[key] : [];
  }

  private asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }

  private auditContext(request: RequestWithId) {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.requestId ?? request.id,
    };
  }
}
