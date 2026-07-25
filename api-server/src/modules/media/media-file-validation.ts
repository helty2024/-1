import { BadRequestException } from '@nestjs/common';
import { open, rm } from 'node:fs/promises';

const signatures: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) =>
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  'image/gif': (buffer) =>
    ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')),
  'image/webp': (buffer) =>
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  'application/pdf': (buffer) =>
    buffer.subarray(0, 5).toString('ascii') === '%PDF-',
};

export async function validateMediaFile(file: Express.Multer.File) {
  try {
    const handle = await open(file.path, 'r');
    try {
      const buffer = Buffer.alloc(16);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      const validate = signatures[file.mimetype];
      if (!validate || !validate(buffer.subarray(0, bytesRead))) {
        throw new BadRequestException('文件内容与文件类型不一致');
      }
    } finally {
      await handle.close();
    }
  } catch (error) {
    await rm(file.path, { force: true });
    throw error;
  }
}
