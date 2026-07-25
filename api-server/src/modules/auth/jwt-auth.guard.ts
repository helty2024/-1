import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { AdminUserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminTokenPayload {
  sub: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  tokenVersion: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token)
      throw new UnauthorizedException('请先登录后台');

    try {
      const payload = await this.jwt.verifyAsync<AdminTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { status: true, deletedAt: true, tokenVersion: true },
      });
      if (
        !admin ||
        admin.deletedAt ||
        admin.status !== AdminUserStatus.ACTIVE ||
        admin.tokenVersion !== payload.tokenVersion
      ) {
        throw new UnauthorizedException();
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('登录状态已失效，请重新登录');
    }
  }
}
