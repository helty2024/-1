import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const redis = await this.redis.health();
      return {
        status:
          redis.status === 'unavailable' || redis.status === 'down'
            ? 'degraded'
            : 'ok',
        service: 'zhishentang-api',
        database: { status: 'up' },
        redis,
        uptimeSeconds: Math.round(process.uptime()),
      };
    } catch {
      throw new ServiceUnavailableException('数据库连接不可用');
    }
  }
}
