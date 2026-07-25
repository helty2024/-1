import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { AdminUserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, request: RequestWithId) {
    const admin = await this.prisma.adminUser.findFirst({
      where: {
        username: dto.username,
        status: AdminUserStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!admin || !(await argon2.verify(admin.passwordHash, dto.password))) {
      throw new UnauthorizedException('账号或密码错误');
    }

    const roles = admin.roles.map(({ role }) => role.code);
    const permissions = [
      ...new Set(
        admin.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    ];
    const user = {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      roles,
      permissions,
    };
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      roles,
      permissions,
      tokenVersion: admin.tokenVersion,
    });

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'login',
          resource: 'auth',
          resourceId: admin.id,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);

    return {
      accessToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '2h'),
      user,
    };
  }

  async getCurrentAdmin(adminId: string) {
    const admin = await this.prisma.adminUser.findFirst({
      where: {
        id: adminId,
        status: AdminUserStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!admin) throw new NotFoundException('管理员账号不存在或已停用');

    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      roles: admin.roles.map(({ role }) => role.code),
      permissions: [
        ...new Set(
          admin.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.code),
          ),
        ),
      ],
    };
  }

  async updateProfile(
    adminId: string,
    dto: UpdateProfileDto,
    request: RequestWithId,
  ) {
    const current = await this.prisma.adminUser.findFirst({
      where: { id: adminId, deletedAt: null },
      select: { username: true, displayName: true },
    });
    if (!current) throw new NotFoundException('管理员账号不存在');

    const duplicate = await this.prisma.adminUser.findFirst({
      where: { username: dto.username, id: { not: adminId } },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('该管理员账号已被使用');

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: adminId },
        data: {
          username: dto.username,
          displayName: dto.displayName,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId: adminId,
          action: 'profile_update',
          resource: 'admin_user',
          resourceId: adminId,
          beforeJson: current,
          afterJson: {
            username: dto.username,
            displayName: dto.displayName,
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);

    return this.getCurrentAdmin(adminId);
  }

  async changePassword(
    adminId: string,
    dto: ChangePasswordDto,
    request: RequestWithId,
  ) {
    const admin = await this.prisma.adminUser.findFirst({
      where: { id: adminId, deletedAt: null },
      select: { passwordHash: true },
    });
    if (!admin) throw new NotFoundException('管理员账号不存在');

    if (!(await argon2.verify(admin.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('当前密码错误');
    }
    if (await argon2.verify(admin.passwordHash, dto.newPassword)) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: adminId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.auditLog.create({
        data: {
          adminUserId: adminId,
          action: 'password_change',
          resource: 'admin_user',
          resourceId: adminId,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: request.requestId ?? request.id,
        },
      }),
    ]);

    return { changed: true, reloginRequired: true };
  }
}
