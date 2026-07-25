import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client';
import {
  AdminUserStatus,
  FormFieldType,
  LeadType,
  PublishStatus,
} from '../src/generated/prisma/enums';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? '127.0.0.1',
  port: Number(process.env.DATABASE_PORT ?? 3307),
  user: process.env.DATABASE_USER ?? 'zhishentang',
  password: process.env.DATABASE_PASSWORD ?? 'zhishentang_local',
  database: process.env.DATABASE_NAME ?? 'zhishentang',
  connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 5),
  allowPublicKeyRetrieval:
    process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL !== 'false',
});

const prisma = new PrismaClient({ adapter });

interface SeedContentAction {
  text: string;
  url: string;
  tab?: boolean;
}

interface SeedContentPage {
  navTitle: string;
  label: string;
  title: string;
  subtitle: string;
  coverImage?: string;
  stats: Array<{ value: string; label: string }>;
  sections: Array<{
    title: string;
    body: string;
    image?: string;
    actionText?: string;
    actionUrl?: string;
    actionTab?: boolean;
    secondaryActionText?: string;
    secondaryActionUrl?: string;
    secondaryActionTab?: boolean;
    cards: Array<{
      title: string;
      desc: string;
      image?: string;
      fileUrl?: string;
      fileName?: string;
      actionText?: string;
      url?: string;
      tab?: boolean;
    }>;
  }>;
  timeline?: Array<{ year: string; text: string }>;
  cases?: Array<{ name: string; type: string; result: string }>;
  faq?: Array<{ q: string; a: string }>;
  primaryAction?: SeedContentAction | null;
  secondaryAction?: SeedContentAction | null;
}

interface SeedProductDetail {
  slug: string;
  name: string;
  subtitle: string;
  category: string;
  position: string;
  people: string;
  channels: string;
  images: Record<string, string>;
  sellingPoints: string[];
  evidence?: {
    title: string;
    intro: string;
    image: string;
    items: Array<{ no: string; title: string; desc: string }>;
  };
  material: string;
  craft: string;
  specs: Array<{ label: string; value: string }>;
  scenarios: string[];
  agencyValue: string[];
  compliance: string;
}

interface SeedProductListItem {
  slug: string;
  shortName: string;
  role: string;
  note: string;
  scene: string;
  image: string;
}

const requireFromSeed = createRequire(join(process.cwd(), 'prisma', 'seed.ts'));
const { contentMap } = requireFromSeed(
  '../../data/officialContent.js',
) as { contentMap: Record<string, SeedContentPage> };

function contentSeedSections(
  content: SeedContentPage,
): Prisma.ContentSectionCreateWithoutPageInput[] {
  const sections: Prisma.ContentSectionCreateWithoutPageInput[] = [
    {
      sectionKey: 'page_meta',
      sectionType: 'page_meta',
      title: content.navTitle,
      subtitle: content.label,
      configJson: {
        coverImage: content.coverImage ?? null,
        primaryAction: content.primaryAction ?? null,
        secondaryAction: content.secondaryAction ?? null,
      } as unknown as Prisma.InputJsonValue,
      sortOrder: 0,
    },
    {
      sectionKey: 'stats',
      sectionType: 'stats',
      configJson: { items: content.stats },
      sortOrder: 10,
    },
    ...content.sections.map((section, index) => ({
      sectionKey: `content_${index + 1}`,
      sectionType: 'content_cards',
      title: section.title,
      body: section.body,
      configJson: {
        image: section.image ?? null,
        actionText: section.actionText ?? null,
        actionUrl: section.actionUrl ?? null,
        actionTab: section.actionTab ?? false,
        secondaryActionText: section.secondaryActionText ?? null,
        secondaryActionUrl: section.secondaryActionUrl ?? null,
        secondaryActionTab: section.secondaryActionTab ?? false,
        cards: section.cards,
      },
      sortOrder: 100 + index,
    })),
  ];

  if (content.timeline?.length) {
    sections.push({
      sectionKey: 'timeline',
      sectionType: 'timeline',
      title: '发展历程',
      configJson: { items: content.timeline },
      sortOrder: 500,
    });
  }
  if (content.cases?.length) {
    sections.push({
      sectionKey: 'cases',
      sectionType: 'cases',
      title: '合作案例',
      configJson: { items: content.cases },
      sortOrder: 510,
    });
  }
  if (content.faq?.length) {
    sections.push({
      sectionKey: 'faq',
      sectionType: 'faq',
      title: '常见问题',
      configJson: { items: content.faq },
      sortOrder: 520,
    });
  }
  return sections;
}

function unwrapDefault<T>(moduleValue: unknown): T {
  let value = moduleValue as Record<string, unknown>;
  while (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'default' in value
  ) {
    value = value.default as Record<string, unknown>;
  }
  return value as T;
}

function productSeedSections(
  product: SeedProductDetail,
  listItem: SeedProductListItem,
): Prisma.ProductSectionCreateWithoutProductInput[] {
  const sections: Prisma.ProductSectionCreateWithoutProductInput[] = [
    {
      sectionKey: 'product_meta',
      sectionType: 'product_meta',
      title: product.category,
      contentJson: {
        shortName: listItem.shortName,
        role: listItem.role,
        listScene: listItem.scene,
        coverImage: listItem.image,
        people: product.people,
        channels: product.channels,
        images: product.images,
      },
      sortOrder: 0,
    },
    {
      sectionKey: 'selling_points',
      sectionType: 'selling_points',
      title: '核心卖点',
      contentJson: { items: product.sellingPoints },
      sortOrder: 100,
    },
    {
      sectionKey: 'material_craft',
      sectionType: 'material_craft',
      title: '原料与工艺',
      contentJson: { material: product.material, craft: product.craft },
      sortOrder: 200,
    },
    {
      sectionKey: 'specs',
      sectionType: 'specs',
      title: '产品规格',
      contentJson: { items: product.specs },
      sortOrder: 300,
    },
    {
      sectionKey: 'scenarios',
      sectionType: 'scenarios',
      title: '使用场景',
      contentJson: { items: product.scenarios },
      sortOrder: 400,
    },
    {
      sectionKey: 'agency_value',
      sectionType: 'agency_value',
      title: '招商价值',
      contentJson: { items: product.agencyValue },
      sortOrder: 500,
    },
    {
      sectionKey: 'compliance',
      sectionType: 'compliance',
      title: '合规说明',
      contentJson: { text: product.compliance },
      sortOrder: 600,
    },
  ];

  if (product.evidence) {
    sections.splice(2, 0, {
      sectionKey: 'evidence',
      sectionType: 'evidence',
      title: product.evidence.title,
      contentJson: {
        intro: product.evidence.intro,
        image: product.evidence.image,
        items: product.evidence.items,
      },
      sortOrder: 150,
    });
  }
  return sections;
}

const permissions = [
  ['dashboard:read', '查看仪表盘', 'dashboard', 'read'],
  ['content:read', '查看内容', 'content', 'read'],
  ['content:write', '编辑内容', 'content', 'write'],
  ['content:publish', '发布内容', 'content', 'publish'],
  ['product:read', '查看产品', 'product', 'read'],
  ['product:write', '编辑产品', 'product', 'write'],
  ['product:publish', '发布产品', 'product', 'publish'],
  ['form:read', '查看表单', 'form', 'read'],
  ['form:write', '编辑表单', 'form', 'write'],
  ['lead:read_all', '查看全部线索', 'lead', 'read_all'],
  ['lead:read_assigned', '查看分配线索', 'lead', 'read_assigned'],
  ['lead:assign', '分配线索', 'lead', 'assign'],
  ['lead:follow', '跟进线索', 'lead', 'follow'],
  ['lead:export', '导出线索', 'lead', 'export'],
  ['lead:view_mobile', '查看完整手机号', 'lead', 'view_mobile'],
  ['media:read', '查看媒体资料', 'media', 'read'],
  ['media:upload', '上传媒体资料', 'media', 'upload'],
  ['media:delete', '删除媒体资料', 'media', 'delete'],
  ['system:user_manage', '管理后台用户', 'system', 'user_manage'],
  ['system:role_manage', '管理角色权限', 'system', 'role_manage'],
  ['audit:read', '查看审计日志', 'audit', 'read'],
] as const;

const defaultForms = [
  {
    code: 'agent',
    name: '代理申请',
    leadType: LeadType.AGENT,
    title: '提交代理合作申请',
    subtitle: '填写基础信息后，合作对接人员将根据你的渠道资源和意向产品进行沟通。',
    successMessage: '代理申请已提交',
    fields: [
      ['name', '姓名', FormFieldType.TEXT, '请输入姓名', true, null],
      ['phone', '手机号', FormFieldType.PHONE, '请输入手机号', true, null],
      ['city', '所在城市', FormFieldType.TEXT, '例如：吉林通化', true, null],
      ['identity', '当前身份', FormFieldType.SELECT, null, true, ['区域代理', '渠道代理', '私域团长', '电商运营者', '门店经营者', '企业采购服务商', '其他']],
      ['channel', '经营渠道', FormFieldType.SELECT, null, true, ['私域社群', '电商平台', '直播带货', '线下门店', '礼赠团购', '健康管理机构', '其他']],
      ['product', '意向产品', FormFieldType.SELECT, null, false, ['黑参液', '知参堂西洋参凉茶', '野山参酒', '知参堂 鲜参礼盒', '珍品野山参', '暂不确定']],
      ['mode', '预计合作方式', FormFieldType.SELECT, null, false, ['区域代理', '渠道合作', '私域团购', '电商分销', '企业团购', '项目定制']],
      ['remark', '留言备注', FormFieldType.TEXTAREA, '请补充渠道情况或合作需求', false, null],
    ],
  },
  {
    code: 'investment',
    name: '投资合作',
    leadType: LeadType.INVESTMENT,
    title: '提交投资合作申请',
    subtitle: '适合项目投资、资源合作、品牌运营、渠道共建和参旅康养方向的合作方。',
    successMessage: '投资合作申请已提交',
    fields: [
      ['name', '姓名', FormFieldType.TEXT, '请输入姓名', true, null],
      ['phone', '手机号', FormFieldType.PHONE, '请输入手机号', true, null],
      ['city', '所在城市', FormFieldType.TEXT, '例如：北京', true, null],
      ['direction', '合作方向', FormFieldType.SELECT, null, true, ['项目投资', '渠道共建', '品牌运营', '参旅康养', '产业资源', '其他']],
      ['resource', '可提供资源', FormFieldType.TEXTAREA, '请简要说明资金、渠道、团队或项目资源', false, null],
      ['remark', '留言备注', FormFieldType.TEXTAREA, '请补充合作诉求', false, null],
    ],
  },
  {
    code: 'consult',
    name: '普通咨询',
    leadType: LeadType.CONSULT,
    title: '提交咨询信息',
    subtitle: '用于产品、品牌、资质、渠道政策等一般问题咨询。',
    successMessage: '咨询信息已提交',
    fields: [
      ['name', '姓名', FormFieldType.TEXT, '请输入姓名', true, null],
      ['phone', '手机号', FormFieldType.PHONE, '请输入手机号', true, null],
      ['topic', '咨询类型', FormFieldType.SELECT, null, true, ['产品咨询', '代理政策', '品牌资质', '合作案例', '投资合作', '其他']],
      ['content', '咨询内容', FormFieldType.TEXTAREA, '请输入咨询内容', false, null],
    ],
  },
] as const;

async function main() {
  for (const [code, name, resource, action] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, resource, action },
      create: { code, name, resource, action },
    });
  }

  const roleDefinitions = [
    {
      code: 'super_admin',
      name: '超级管理员',
      description: '拥有全部系统权限',
      permissions: permissions.map(([code]) => code),
    },
    {
      code: 'content_editor',
      name: '内容编辑',
      description: '维护企业、品牌、招商与媒体内容',
      permissions: [
        'dashboard:read',
        'content:read',
        'content:write',
        'content:publish',
        'media:read',
        'media:upload',
      ],
    },
    {
      code: 'product_operator',
      name: '产品运营',
      description: '维护明星产品和产品资料',
      permissions: [
        'dashboard:read',
        'product:read',
        'product:write',
        'product:publish',
        'media:read',
        'media:upload',
      ],
    },
    {
      code: 'lead_manager',
      name: '线索负责人',
      description: '查看、分配、跟进和导出线索',
      permissions: [
        'dashboard:read',
        'lead:read_all',
        'lead:assign',
        'lead:follow',
        'lead:export',
        'lead:view_mobile',
      ],
    },
  ];

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { code: definition.code },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
      create: {
        code: definition.code,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
    });

    const rolePermissions = await prisma.permission.findMany({
      where: { code: { in: definition.permissions } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: rolePermissions.map(({ id }) => ({ roleId: role.id, permissionId: id })),
      skipDuplicates: true,
    });
  }

  for (const definition of defaultForms) {
    const existingForm = await prisma.leadForm.findUnique({
      where: { code: definition.code },
      select: { id: true },
    });
    if (existingForm) continue;

    const form = await prisma.leadForm.create({
      data: {
        code: definition.code,
        name: definition.name,
        leadType: definition.leadType,
        title: definition.title,
        subtitle: definition.subtitle,
        successMessage: definition.successMessage,
        status: PublishStatus.PUBLISHED,
      },
    });

    await prisma.leadFormField.createMany({
      data: definition.fields.map(
        ([fieldKey, label, fieldType, placeholder, required, options], sortOrder) => ({
          formId: form.id,
          fieldKey,
          label,
          fieldType,
          placeholder,
          required,
          optionsJson: options ? [...options] : undefined,
          validationJson:
            fieldType === FormFieldType.PHONE
              ? { pattern: '^1[3-9]\\d{9}$' }
              : undefined,
          sortOrder,
          isVisible: true,
        }),
      ),
    });
  }

  for (const [slug, content] of Object.entries(contentMap)) {
    const existingPage = await prisma.contentPage.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingPage) continue;

    await prisma.contentPage.create({
      data: {
        slug,
        pageType: slug,
        title: content.title,
        subtitle: content.subtitle,
        summary: content.label,
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        sections: { create: contentSeedSections(content) },
      },
    });
  }

  const productDetailPath = '../../pages/official/data/products.js';
  const productListPath = '../../data/officialProducts.js';
  const productDetails = unwrapDefault<Record<string, SeedProductDetail>>(
    await import(productDetailPath),
  );
  const productList = unwrapDefault<SeedProductListItem[]>(
    await import(productListPath),
  );

  for (const [sortOrder, listItem] of productList.entries()) {
    const detail = productDetails[listItem.slug];
    if (!detail) continue;
    const existingProduct = await prisma.product.findUnique({
      where: { slug: listItem.slug },
      select: { id: true },
    });
    if (existingProduct) continue;

    await prisma.product.create({
      data: {
        slug: detail.slug,
        categoryCode: detail.slug,
        name: detail.name,
        subtitle: detail.subtitle,
        summary: listItem.note,
        agencyPosition: detail.position,
        status: PublishStatus.PUBLISHED,
        sortOrder: sortOrder * 10,
        publishedAt: new Date(),
        sections: { create: productSeedSections(detail, listItem) },
      },
    });
  }

  const username = process.env.ADMIN_SEED_USERNAME ?? 'admin';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe_2026!';
  const displayName = process.env.ADMIN_SEED_DISPLAY_NAME ?? '超级管理员';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: { displayName, status: AdminUserStatus.ACTIVE },
    create: {
      username,
      passwordHash,
      displayName,
      status: AdminUserStatus.ACTIVE,
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { code: 'super_admin' },
  });

  await prisma.adminUserRole.upsert({
    where: {
      adminUserId_roleId: {
        adminUserId: admin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: { adminUserId: admin.id, roleId: superAdminRole.id },
  });

  console.log(`Seed complete. Admin username: ${username}`);
  console.log('Change ADMIN_SEED_PASSWORD before any non-local deployment.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
