import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
} from 'node:crypto';

@Injectable()
export class DataProtectionService {
  private readonly key: Buffer;
  private readonly hashKey: string;

  constructor(config: ConfigService) {
    this.hashKey = config.getOrThrow<string>('APP_DATA_ENCRYPTION_KEY');
    this.key = createHash('sha256').update(this.hashKey).digest();
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(value?: string | null): string | null {
    if (!value) return null;
    const [version, ivText, tagText, encryptedText] = value.split(':');
    if (version !== 'v1' || !ivText || !tagText || !encryptedText) return null;
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(ivText, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tagText, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }

  searchableHash(value: string): string {
    return createHmac('sha256', this.hashKey).update(value).digest('hex');
  }

  maskMobile(value: string): string {
    if (value.length < 7) return value;
    return `${value.slice(0, 3)}****${value.slice(-4)}`;
  }
}
