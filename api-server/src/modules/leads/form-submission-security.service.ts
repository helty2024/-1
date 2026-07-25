import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { RequestWithId } from '../../common/http/request-with-id.interface';
import { DataProtectionService } from '../../common/security/data-protection.service';
import { RedisService } from '../redis/redis.service';
import type { CreatePublicLeadDto } from './dto/create-public-lead.dto';

interface Reservation {
  key: string;
  owner: string;
  ttlSeconds: number;
  existingLeadId?: string;
}

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class FormSubmissionSecurityService {
  private readonly rateWindowSeconds: number;
  private readonly ipLimit: number;
  private readonly formIpLimit: number;
  private readonly maxBodyBytes: number;
  private readonly allowedSources: Set<string>;
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
    private readonly protection: DataProtectionService,
  ) {
    this.rateWindowSeconds = config.get<number>(
      'PUBLIC_FORM_RATE_WINDOW_SECONDS',
      600,
    );
    this.ipLimit = config.get<number>('PUBLIC_FORM_RATE_IP_MAX', 20);
    this.formIpLimit = config.get<number>('PUBLIC_FORM_RATE_FORM_IP_MAX', 6);
    this.maxBodyBytes = config.get<number>('PUBLIC_FORM_MAX_BODY_BYTES', 32768);
    this.allowedSources = new Set(
      config
        .get<string>('PUBLIC_FORM_ALLOWED_SOURCES', 'wechat_miniprogram,web')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    );
  }

  async inspectRequest(
    dto: CreatePublicLeadDto,
    request: RequestWithId,
  ): Promise<{
    ipHash: string;
    source: string;
    sourceDetail: Record<string, string | number | boolean | null>;
  }> {
    if (dto.website?.trim()) {
      throw new BadRequestException('提交内容未通过安全校验');
    }

    const bodyBytes = Buffer.byteLength(JSON.stringify(dto), 'utf8');
    if (bodyBytes > this.maxBodyBytes) {
      throw new BadRequestException('提交内容过大，请精简后重试');
    }
    if (Object.keys(dto.values).length > 50) {
      throw new BadRequestException('表单字段数量超过限制');
    }

    const source = dto.source ?? 'wechat_miniprogram';
    if (!this.allowedSources.has(source)) {
      throw new BadRequestException('提交来源无效');
    }

    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const ipHash = this.protection.searchableHash(ip);
    await this.consumeRate(`public-form:rate:ip:${ipHash}`, this.ipLimit);
    await this.consumeRate(
      `public-form:rate:form:${dto.formCode}:${ipHash}`,
      this.formIpLimit,
    );
    return {
      ipHash,
      source,
      sourceDetail: this.sanitizeSourceDetail(dto.sourceDetail),
    };
  }

  async reserve(
    formId: string,
    dto: CreatePublicLeadDto,
    normalizedValues: Record<string, string | string[]>,
  ): Promise<Reservation> {
    const fingerprint = this.protection.searchableHash(
      this.stableStringify({ formId, values: normalizedValues }),
    );
    const identifier = dto.submissionId
      ? this.protection.searchableHash(`${formId}:${dto.submissionId}`)
      : fingerprint;
    const ttlSeconds = dto.submissionId ? 86_400 : 300;
    const key = `public-form:submission:${identifier}`;
    const owner = randomUUID();
    const pendingValue = `pending:${owner}`;
    const client = this.redis.getClient();

    if (client?.status === 'ready') {
      const current = await client.get(key);
      if (current?.startsWith('lead:')) {
        return {
          key,
          owner,
          ttlSeconds,
          existingLeadId: current.slice(5),
        };
      }
      if (current) throw new ConflictException('申请正在提交，请勿重复操作');
      const acquired = await client.set(key, pendingValue, 'EX', 30, 'NX');
      if (acquired !== 'OK') {
        throw new ConflictException('申请正在提交，请勿重复操作');
      }
      return { key, owner, ttlSeconds };
    }

    this.pruneMemory();
    const current = this.memory.get(key);
    if (current?.value.startsWith('lead:')) {
      return {
        key,
        owner,
        ttlSeconds,
        existingLeadId: current.value.slice(5),
      };
    }
    if (current) throw new ConflictException('申请正在提交，请勿重复操作');
    this.memory.set(key, {
      value: pendingValue,
      expiresAt: Date.now() + 30_000,
    });
    return { key, owner, ttlSeconds };
  }

  async complete(reservation: Reservation, leadId: string) {
    const client = this.redis.getClient();
    if (client?.status === 'ready') {
      await client.set(
        reservation.key,
        `lead:${leadId}`,
        'EX',
        reservation.ttlSeconds,
      );
      return;
    }
    this.memory.set(reservation.key, {
      value: `lead:${leadId}`,
      expiresAt: Date.now() + reservation.ttlSeconds * 1000,
    });
  }

  async release(reservation: Reservation) {
    const pendingValue = `pending:${reservation.owner}`;
    const client = this.redis.getClient();
    if (client?.status === 'ready') {
      const current = await client.get(reservation.key);
      if (current === pendingValue) await client.del(reservation.key);
      return;
    }
    if (this.memory.get(reservation.key)?.value === pendingValue) {
      this.memory.delete(reservation.key);
    }
  }

  async invalidate(reservation: Reservation) {
    const client = this.redis.getClient();
    if (client?.status === 'ready') {
      await client.del(reservation.key);
      return;
    }
    this.memory.delete(reservation.key);
  }

  private async consumeRate(key: string, limit: number) {
    const client = this.redis.getClient();
    let count: number;
    if (client?.status === 'ready') {
      count = await client.incr(key);
      if (count === 1) await client.expire(key, this.rateWindowSeconds);
    } else {
      this.pruneMemory();
      const current = this.memory.get(key);
      count = current ? Number(current.value) + 1 : 1;
      this.memory.set(key, {
        value: String(count),
        expiresAt: Date.now() + this.rateWindowSeconds * 1000,
      });
    }
    if (count > limit) {
      throw new HttpException(
        '提交过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${this.stableStringify(record[key])}`,
        )
        .join(',')}}`;
    }
    return JSON.stringify(value);
  }

  private sanitizeSourceDetail(input?: Record<string, unknown>) {
    if (!input) return {};
    const entries = Object.entries(input);
    if (entries.length > 20) {
      throw new BadRequestException('来源信息字段数量超过限制');
    }
    const result: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of entries) {
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(key)) {
        throw new BadRequestException('来源信息字段格式不正确');
      }
      if (
        value !== null &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        throw new BadRequestException('来源信息只允许简单文本或数字');
      }
      if (typeof value === 'string' && value.length > 500) {
        throw new BadRequestException('来源信息内容过长');
      }
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new BadRequestException('来源信息数字无效');
      }
      result[key] = value;
    }
    return result;
  }

  private pruneMemory() {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
  }
}
