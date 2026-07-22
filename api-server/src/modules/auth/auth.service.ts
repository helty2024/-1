import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { AdminUserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';

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
}
