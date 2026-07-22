import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { AdminUserStatus } from '../src/generated/prisma/enums';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? '127.0.0.1',
  port: Number(process.env.DATABASE_PORT ?? 3307),
  user: process.env.DATABASE_USER ?? 'zhishentang',
  password: process.env.DATABASE_PASSWORD ?? 'zhishentang_local',
  database: process.env.DATABASE_NAME ?? 'zhishentang',
  connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 5),
});

const prisma = new PrismaClient({ adapter });

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
