import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { AdminUserStatus } from '../src/generated/prisma/enums';

if (process.env.NODE_ENV === 'production') {
  throw new Error('E2E administrator script cannot run in production.');
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? '127.0.0.1',
  port: Number(process.env.DATABASE_PORT ?? 3307),
  user: process.env.DATABASE_USER ?? 'zhishentang',
  password: process.env.DATABASE_PASSWORD ?? 'zhishentang_local',
  database: process.env.DATABASE_NAME ?? 'zhishentang',
  connectionLimit: 2,
  allowPublicKeyRetrieval:
    process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL !== 'false',
});
const prisma = new PrismaClient({ adapter });
const username = process.env.E2E_ADMIN_USERNAME ?? 'e2e_admin';
const password = process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdmin_2026!';

async function create() {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const role = await prisma.role.findUniqueOrThrow({
    where: { code: 'super_admin' },
  });
  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: {
      passwordHash,
      displayName: 'E2E Test Admin',
      status: AdminUserStatus.ACTIVE,
      deletedAt: null,
      tokenVersion: { increment: 1 },
    },
    create: {
      username,
      passwordHash,
      displayName: 'E2E Test Admin',
      status: AdminUserStatus.ACTIVE,
    },
  });
  await prisma.adminUserRole.upsert({
    where: { adminUserId_roleId: { adminUserId: admin.id, roleId: role.id } },
    update: {},
    create: { adminUserId: admin.id, roleId: role.id },
  });
  console.log(`E2E administrator ready: ${username}`);
}

async function remove() {
  await prisma.adminUser.deleteMany({ where: { username } });
  console.log(`E2E administrator removed: ${username}`);
}

async function main() {
  const action = process.argv[2];
  try {
    if (action === 'create') await create();
    else if (action === 'delete') await remove();
    else throw new Error('Expected action: create or delete');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
