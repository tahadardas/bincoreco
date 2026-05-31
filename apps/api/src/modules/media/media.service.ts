import { Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuid } from 'uuid';

export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 3 * 1024 * 1024;
const UPLOAD_ROOT = path.resolve(process.cwd(), '../../uploads');

@Injectable()
export class MediaService {
  async upload(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadResult> {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${ALLOWED_MIMES.join(', ')}`,
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException(`File too large. Max 3MB`);
    }

    const safeFolder = ['products', 'banners', 'brand', 'general'].includes(folder) ? folder : 'general';
    const dir = path.join(UPLOAD_ROOT, safeFolder);
    await fs.mkdir(dir, { recursive: true });

    const ext = this.extension(file.mimetype, file.originalname);
    const filename = `${uuid()}${ext}`;
    const filepath = path.join(dir, filename);

    await fs.writeFile(filepath, file.buffer);

    return {
      url: `/uploads/${safeFolder}/${filename}`,
      filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(url: string): Promise<void> {
    const relative = url.replace(/^\/uploads\//, '');
    const filepath = path.join(UPLOAD_ROOT, relative);
    try { await fs.unlink(filepath); } catch { /* file may not exist */ }
  }

  private extension(mime: string, original: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    return map[mime] || path.extname(original) || '.jpg';
  }
}
