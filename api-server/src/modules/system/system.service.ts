import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import type { Prisma } from '../../generated/prisma/client';
import { AdminUserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditLogQueryDto } from './dto/audit-log-query.dto';
import {
  AdminUserStatusInput,
  type CreateAdminUserDto,
  type ListAdminUsersQueryDto,
  type ResetAdminPasswordDto,
  type UpdateAdminUserDto,
  type UpdateAdminUserStatusDto,
} from './dto/admin-user.dto';
import type { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

const userInclude = {
  roles: {
    include: { role: true },
    orderBy: { role: { name: 'asc' as const } },
  },
};

const roleInclude = {
  permissions: {
    include: { permission: true },
    orderBy: { permission: { code: 'asc' as const } },
  },
  _count: { select: { users: true } },
};

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: ListAdminUsersQueryDto) {
    const where: Prisma.AdminUserWhereInput = {
      deletedAt: null,
      status: query.status ? this.toUserStatus(query.status) : undefined,
      OR: query.search?.trim()
        ? [
            { username: { contains: query.search.trim() } },
            { displayName: { contains: query.search.trim() } },
          ]
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminUser.findMany({
        where,
        include: userInclude,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.adminUser.count({ where }),
    ]);
    return {
      items: items.map((item) => this.serializeUser(item)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async createUser(
    dto: CreateAdminUserDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    await this.ensureUsernameAvailable(dto.username);
    const roles = await this.requireRoles(dto.roleIds);
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adminUser.create({
        data: {
          username: dto.username.trim(),
          displayName: dto.displayName.trim(),
          passwordHash,
          roles: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        include: userInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'admin_user_create',
          resource: 'admin_user',
          resourceId: created.id,
          afterJson: {
            username: created.username,
            displayName: created.displayName,
            roleCodes: roles.map((role) => role.code),
          },
          ...this.auditContext(request),
        },
      });
      return created;
    });
    return this.serializeUser(user);
  }

  async updateUser(
    id: string,
    dto: UpdateAdminUserDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    if (id === operatorId) {
      throw new BadRequestException('请在“我的账号”中修改当前账号');
    }
    const current = await this.getUser(id);
    await this.ensureUsernameAvailable(dto.username, id);
    const roles = await this.requireRoles(dto.roleIds);
    await this.ensureSuperAdminRemains(
      id,
      current.roles.some(({ role }) => role.code === 'super_admin') &&
        !roles.some((role) => role.code === 'super_admin'),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.adminUserRole.deleteMany({ where: { adminUserId: id } });
      const user = await tx.adminUser.update({
        where: { id },
        data: {
          username: dto.username.trim(),
          displayName: dto.displayName.trim(),
          tokenVersion: { increment: 1 },
          roles: {
            create: roles.map((role) => ({ roleId: role.id })),
          },
        },
        include: userInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'admin_user_update',
          resource: 'admin_user',
          resourceId: id,
          beforeJson: {
            username: current.username,
            displayName: current.displayName,
            roleCodes: current.roles.map(({ role }) => role.code),
          },
          afterJson: {
            username: user.username,
            displayName: user.displayName,
            roleCodes: roles.map((role) => role.code),
          },
          ...this.auditContext(request),
        },
      });
      return user;
    });
    return this.serializeUser(updated);
  }

  async updateUserStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    if (id === operatorId && dto.status === AdminUserStatusInput.DISABLED) {
      throw new BadRequestException('不能停用当前登录账号');
    }
    const current = await this.getUser(id);
    const status = this.toUserStatus(dto.status);
    await this.ensureSuperAdminRemains(
      id,
      status === AdminUserStatus.DISABLED &&
        current.status === AdminUserStatus.ACTIVE &&
        current.roles.some(({ role }) => role.code === 'super_admin'),
    );
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.update({
        where: { id },
        data: { status, tokenVersion: { increment: 1 } },
        include: userInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId: operatorId,
          action:
            status === AdminUserStatus.ACTIVE
              ? 'admin_user_enable'
              : 'admin_user_disable',
          resource: 'admin_user',
          resourceId: id,
          beforeJson: { status: current.status.toLowerCase() },
          afterJson: { status: status.toLowerCase() },
          ...this.auditContext(request),
        },
      });
      return user;
    });
    return this.serializeUser(updated);
  }

  async resetUserPassword(
    id: string,
    dto: ResetAdminPasswordDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    if (id === operatorId) {
      throw new BadRequestException('请在“我的账号”中修改自己的密码');
    }
    await this.getUser(id);
    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'admin_user_password_reset',
          resource: 'admin_user',
          resourceId: id,
          ...this.auditContext(request),
        },
      }),
    ]);
    return { changed: true };
  }

  async listRoles() {
    const items = await this.prisma.role.findMany({
      include: roleInclude,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
    return items.map((item) => this.serializeRole(item));
  }

  async listRoleOptions() {
    return this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, code: true, name: true },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        resource: true,
        action: true,
        description: true,
      },
    });
  }

  async createRole(
    dto: CreateRoleDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    const duplicate = await this.prisma.role.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('该角色编码已存在');
    const permissions = await this.requirePermissions(dto.permissionIds);
    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          code: dto.code,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          permissions: {
            create: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
        include: roleInclude,
      });
      await tx.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'role_create',
          resource: 'role',
          resourceId: created.id,
          afterJson: {
            code: created.code,
            name: created.name,
            permissionCodes: permissions.map((item) => item.code),
          },
          ...this.auditContext(request),
        },
      });
      return created;
    });
    return this.serializeRole(role);
  }

  async updateRole(
    id: string,
    dto: UpdateRoleDto,
    operatorId: string,
    request: RequestWithId,
  ) {
    const current = await this.getRole(id);
    if (current.code === 'super_admin') {
      throw new BadRequestException('超级管理员权限不可修改');
    }
    const permissions = await this.requirePermissions(dto.permissionIds);
    const role = await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      const updated = await tx.role.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          permissions: {
            create: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
        include: roleInclude,
      });
      await tx.adminUser.updateMany({
        where: { roles: { some: { roleId: id } } },
        data: { tokenVersion: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'role_update',
          resource: 'role',
          resourceId: id,
          beforeJson: {
            name: current.name,
            permissionCodes: current.permissions.map(
              ({ permission }) => permission.code,
            ),
          },
          afterJson: {
            name: updated.name,
            permissionCodes: permissions.map((item) => item.code),
          },
          ...this.auditContext(request),
        },
      });
      return updated;
    });
    return this.serializeRole(role);
  }

  async removeRole(id: string, operatorId: string, request: RequestWithId) {
    const current = await this.getRole(id);
    if (current.isSystem) throw new BadRequestException('系统内置角色不能删除');
    if (current._count.users > 0) {
      throw new BadRequestException('该角色仍有管理员使用，请先调整管理员角色');
    }
    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          adminUserId: operatorId,
          action: 'role_delete',
          resource: 'role',
          resourceId: id,
          beforeJson: { code: current.code, name: current.name },
          ...this.auditContext(request),
        },
      }),
      this.prisma.role.delete({ where: { id } }),
    ]);
    return { deleted: true };
  }

  async listAuditLogs(query: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      action: query.action || undefined,
      resource: query.resource || undefined,
      adminUserId: query.adminUserId || undefined,
      createdAt:
        query.dateFrom || query.dateTo
          ? {
              gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
              lte: query.dateTo ? new Date(query.dateTo) : undefined,
            }
          : undefined,
      OR: query.search?.trim()
        ? [
            { action: { contains: query.search.trim() } },
            { resourceId: { contains: query.search.trim() } },
            { adminUser: { username: { contains: query.search.trim() } } },
            { adminUser: { displayName: { contains: query.search.trim() } } },
          ]
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          adminUser: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getAuditOptions() {
    const [actionRows, resourceRows, admins] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        orderBy: { action: 'asc' },
        select: { action: true },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['resource'],
        orderBy: { resource: 'asc' },
        select: { resource: true },
      }),
      this.prisma.adminUser.findMany({
        where: { deletedAt: null, auditLogs: { some: {} } },
        orderBy: { displayName: 'asc' },
        select: { id: true, username: true, displayName: true },
      }),
    ]);
    return {
      actions: actionRows.map((item) => item.action),
      resources: resourceRows.map((item) => item.resource),
      admins,
    };
  }

  private async getUser(id: string) {
    const user = await this.prisma.adminUser.findFirst({
      where: { id, deletedAt: null },
      include: userInclude,
    });
    if (!user) throw new NotFoundException('管理员不存在');
    return user;
  }

  private async getRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: roleInclude,
    });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  private async ensureUsernameAvailable(username: string, excludeId?: string) {
    const duplicate = await this.prisma.adminUser.findFirst({
      where: {
        username: username.trim(),
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('该管理员账号已被使用');
  }

  private async requireRoles(roleIds: string[]) {
    const ids = [...new Set(roleIds)];
    const roles = await this.prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true },
    });
    if (roles.length !== ids.length)
      throw new BadRequestException('包含无效角色');
    return roles;
  }

  private async requirePermissions(permissionIds: string[]) {
    const ids = [...new Set(permissionIds)];
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true },
    });
    if (permissions.length !== ids.length) {
      throw new BadRequestException('包含无效权限');
    }
    return permissions;
  }

  private async ensureSuperAdminRemains(id: string, needsCheck: boolean) {
    if (!needsCheck) return;
    const remaining = await this.prisma.adminUser.count({
      where: {
        id: { not: id },
        deletedAt: null,
        status: AdminUserStatus.ACTIVE,
        roles: { some: { role: { code: 'super_admin' } } },
      },
    });
    if (remaining === 0) {
      throw new BadRequestException('系统必须保留至少一个启用的超级管理员');
    }
  }

  private serializeUser(user: Awaited<ReturnType<SystemService['getUser']>>) {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      status: user.status.toLowerCase(),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map(({ role }) => ({
        id: role.id,
        code: role.code,
        name: role.name,
      })),
    };
  }

  private serializeRole(role: Awaited<ReturnType<SystemService['getRole']>>) {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissions: role.permissions.map(({ permission }) => ({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private toUserStatus(status: AdminUserStatusInput) {
    return status === AdminUserStatusInput.ACTIVE
      ? AdminUserStatus.ACTIVE
      : AdminUserStatus.DISABLED;
  }

  private auditContext(request: RequestWithId) {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.requestId ?? request.id,
    };
  }
}
