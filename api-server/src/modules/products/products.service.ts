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
  ProductPublishStatusInput,
  type SaveProductDto,
} from './dto/save-product.dto';

const detailInclude = {
  sections: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

const statusMap = {
  draft: PublishStatus.DRAFT,
  published: PublishStatus.PUBLISHED,
  offline: PublishStatus.OFFLINE,
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminProducts() {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: detailInclude,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    return products.map((product) => this.serialize(product));
  }

  async getAdminProduct(id: string) {
    return this.serialize(await this.findProduct(id));
  }

  async listPublicProducts() {
    const products = await this.prisma.product.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null },
      include: detailInclude,
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    });
    return products.map((product) => this.serialize(product));
  }

  async getPublicProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED, deletedAt: null },
      include: detailInclude,
    });
    if (!product) throw new NotFoundException('产品不存在或尚未发布');
    return this.serialize(product);
  }

  async create(dto: SaveProductDto, adminUserId: string, request: RequestWithId) {
    const exists = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });
    if (exists) throw new ConflictException('产品编码已存在');

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug: dto.slug,
          categoryCode: dto.categoryCode,
          name: dto.name,
          subtitle: dto.subtitle,
          summary: dto.listNote,
          agencyPosition: dto.position,
          status: PublishStatus.DRAFT,
          sortOrder: dto.sortOrder,
          sections: { create: this.buildSections(dto) },
        },
        include: detailInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: 'product_create',
          resource: 'product',
          resourceId: created.id,
          afterJson: { slug: dto.slug, name: dto.name, status: 'draft' },
          ...this.auditContext(request),
        },
      });
      return created;
    });
    return this.serialize(product);
  }

  async update(
    id: string,
    dto: SaveProductDto,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findProduct(id);
    const duplicate = await this.prisma.product.findFirst({
      where: { slug: dto.slug, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('产品编码已存在');

    await this.prisma.$transaction(async (tx) => {
      await tx.productSection.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: {
          slug: dto.slug,
          categoryCode: dto.categoryCode,
          name: dto.name,
          subtitle: dto.subtitle,
          summary: dto.listNote,
          agencyPosition: dto.position,
          sortOrder: dto.sortOrder,
          version: { increment: 1 },
          sections: { create: this.buildSections(dto) },
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId,
          action: 'product_update',
          resource: 'product',
          resourceId: id,
          beforeJson: { slug: current.slug, name: current.name, version: current.version },
          afterJson: { slug: dto.slug, name: dto.name, version: current.version + 1 },
          ...this.auditContext(request),
        },
      });
    });
    return this.getAdminProduct(id);
  }

  async updateStatus(
    id: string,
    status: ProductPublishStatusInput,
    adminUserId: string,
    request: RequestWithId,
  ) {
    const current = await this.findProduct(id);
    const nextStatus = statusMap[status];
    if (current.status === nextStatus) return this.serialize(current);

    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: {
          status: nextStatus,
          publishedAt: nextStatus === PublishStatus.PUBLISHED ? new Date() : null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'product_status_update',
          resource: 'product',
          resourceId: id,
          beforeJson: { status: current.status.toLowerCase() },
          afterJson: { status },
          ...this.auditContext(request),
        },
      }),
    ]);
    return this.getAdminProduct(id);
  }

  async remove(id: string, adminUserId: string, request: RequestWithId) {
    const current = await this.findProduct(id);
    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: PublishStatus.OFFLINE },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId,
          action: 'product_delete',
          resource: 'product',
          resourceId: id,
          beforeJson: { slug: current.slug, name: current.name },
          ...this.auditContext(request),
        },
      }),
    ]);
    return { deleted: true };
  }

  private async findProduct(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
    if (!product) throw new NotFoundException('产品不存在');
    return product;
  }

  private buildSections(dto: SaveProductDto): Prisma.ProductSectionCreateWithoutProductInput[] {
    const sections: Prisma.ProductSectionCreateWithoutProductInput[] = [
      {
        sectionKey: 'product_meta',
        sectionType: 'product_meta',
        title: dto.category,
        contentJson: this.toJson({
          shortName: dto.shortName,
          role: dto.role,
          listScene: dto.listScene,
          coverImage: dto.coverImage,
          people: dto.people,
          channels: dto.channels,
          images: dto.images,
        }),
        sortOrder: 0,
      },
      {
        sectionKey: 'selling_points',
        sectionType: 'selling_points',
        title: '核心卖点',
        contentJson: this.toJson({ items: dto.sellingPoints }),
        sortOrder: 100,
      },
      {
        sectionKey: 'material_craft',
        sectionType: 'material_craft',
        title: '原料与工艺',
        contentJson: this.toJson({ material: dto.material, craft: dto.craft }),
        sortOrder: 200,
      },
      {
        sectionKey: 'specs',
        sectionType: 'specs',
        title: '产品规格',
        contentJson: this.toJson({ items: dto.specs }),
        sortOrder: 300,
      },
      {
        sectionKey: 'scenarios',
        sectionType: 'scenarios',
        title: '使用场景',
        contentJson: this.toJson({ items: dto.scenarios }),
        sortOrder: 400,
      },
      {
        sectionKey: 'agency_value',
        sectionType: 'agency_value',
        title: '招商价值',
        contentJson: this.toJson({ items: dto.agencyValue }),
        sortOrder: 500,
      },
      {
        sectionKey: 'compliance',
        sectionType: 'compliance',
        title: '合规说明',
        contentJson: this.toJson({ text: dto.compliance }),
        sortOrder: 600,
      },
    ];

    if (dto.evidence) {
      sections.splice(2, 0, {
        sectionKey: 'evidence',
        sectionType: 'evidence',
        title: dto.evidence.title,
        contentJson: this.toJson({
          intro: dto.evidence.intro,
          image: dto.evidence.image,
          items: dto.evidence.items,
        }),
        sortOrder: 150,
      });
    }
    return sections;
  }

  private serialize(product: ProductRecord) {
    const sections = new Map(product.sections.map((section) => [section.sectionType, section]));
    const meta = sections.get('product_meta');
    const metaJson = this.asObject(meta?.contentJson);
    const materialCraft = this.asObject(sections.get('material_craft')?.contentJson);
    const evidenceSection = sections.get('evidence');
    const evidenceJson = this.asObject(evidenceSection?.contentJson);

    return {
      id: product.id,
      slug: product.slug,
      categoryCode: product.categoryCode ?? '',
      name: product.name,
      shortName: this.stringValue(metaJson.shortName),
      subtitle: product.subtitle ?? '',
      category: meta?.title ?? '',
      position: product.agencyPosition ?? '',
      people: this.stringValue(metaJson.people),
      channels: this.stringValue(metaJson.channels),
      role: this.stringValue(metaJson.role),
      listNote: product.summary ?? '',
      listScene: this.stringValue(metaJson.listScene),
      coverImage: this.stringValue(metaJson.coverImage),
      images: this.asObject(metaJson.images),
      sellingPoints: this.readItems(sections.get('selling_points')?.contentJson),
      evidence: evidenceSection
        ? {
            title: evidenceSection.title ?? '',
            intro: this.stringValue(evidenceJson.intro),
            image: this.stringValue(evidenceJson.image),
            items: this.readItems(evidenceSection.contentJson),
          }
        : null,
      material: this.stringValue(materialCraft.material),
      craft: this.stringValue(materialCraft.craft),
      specs: this.readItems(sections.get('specs')?.contentJson),
      scenarios: this.readItems(sections.get('scenarios')?.contentJson),
      agencyValue: this.readItems(sections.get('agency_value')?.contentJson),
      compliance: this.stringValue(this.asObject(sections.get('compliance')?.contentJson).text),
      sortOrder: product.sortOrder,
      status: product.status.toLowerCase(),
      version: product.version,
      publishedAt: product.publishedAt,
      updatedAt: product.updatedAt,
    };
  }

  private readItems(value: unknown): unknown[] {
    const object = this.asObject(value);
    return Array.isArray(object.items) ? object.items : [];
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
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
