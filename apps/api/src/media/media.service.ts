import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';

@Injectable()
export class MediaService {
  private readonly uploadRoot = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

  async saveVideo(file: any, req: Request) {
    if (!file) {
      throw new BadRequestException('Choose a video file first.');
    }

    if (!String(file.mimetype || '').startsWith('video/')) {
      throw new BadRequestException('Only video files are supported for YouTube publishing.');
    }

    const extension = this.getExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${extension}`;
    await mkdir(this.uploadRoot, { recursive: true });
    await writeFile(join(this.uploadRoot, filename), file.buffer);

    const origin = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    return {
      url: `${origin}/uploads/${filename}`,
      filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  private getExtension(originalName = '', mimeType = '') {
    const originalExtension = extname(originalName).toLowerCase();
    if (originalExtension) return originalExtension;

    if (mimeType === 'video/quicktime') return '.mov';
    if (mimeType === 'video/webm') return '.webm';
    if (mimeType === 'video/x-matroska') return '.mkv';
    return '.mp4';
  }
}
