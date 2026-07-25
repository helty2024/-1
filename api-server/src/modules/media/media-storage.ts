import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { diskStorage } from 'multer';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const mimeExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

export function getMediaStorageRoot() {
  return resolve(
    process.cwd(),
    process.env.MEDIA_STORAGE_DIR ?? 'storage/media',
  );
}

export function getMediaTempRoot() {
  return resolve(
    process.cwd(),
    process.env.MEDIA_TEMP_DIR ?? 'storage/tmp/media',
  );
}

export function currentMediaDatePath() {
  const now = new Date();
  return [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
  ];
}

export function createMediaObjectKey(file: Express.Multer.File) {
  const extension = mimeExtensions[file.mimetype] ?? '';
  return [...currentMediaDatePath(), `${randomUUID()}${extension}`].join('/');
}

export const mediaMulterOptions = {
  storage: diskStorage({
    destination: (_request, _file, callback) => {
      const destination = getMediaTempRoot();
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, _file, callback) => {
      callback(null, `${randomUUID()}.upload`);
    },
  }),
  limits: {
    fileSize: Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES ?? 20 * 1024 * 1024),
    files: 1,
  },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new BadRequestException('仅支持 JPG、PNG、WebP、GIF 和 PDF 文件'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
