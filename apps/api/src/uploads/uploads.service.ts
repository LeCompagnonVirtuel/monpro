import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { IStorageProvider, STORAGE_PROVIDER } from './providers/storage.interface';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = ['avatars', 'services', 'kyc', 'messages', 'reviews', 'categories'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];

@Injectable()
export class UploadsService {
  constructor(@Inject(STORAGE_PROVIDER) private storageProvider: IStorageProvider) {}

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) throw new BadRequestException('Aucun fichier envoyé');

    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new BadRequestException(`Dossier non autorisé. Dossiers valides: ${ALLOWED_FOLDERS.join(', ')}`);
    }

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException('Format non supporté. Formats acceptés: JPEG, PNG, WebP');
    }

    if (file.size > MAX_SIZE) {
      throw new BadRequestException('Fichier trop volumineux (max 5 Mo)');
    }

    const rawExt = path.extname(file.originalname).toLowerCase();
    const ext = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.jpg';
    const filename = `${uuid()}${ext}`;

    return this.storageProvider.upload(
      { buffer: file.buffer, filename, mimetype: file.mimetype },
      folder,
    );
  }

  async deleteFile(url: string): Promise<void> {
    const relativePath = url.replace('/uploads/', '');
    const parts = relativePath.split('/');
    if (parts.length !== 2 || !ALLOWED_FOLDERS.includes(parts[0])) return;

    await this.storageProvider.delete(`uploads/${parts[0]}/${path.basename(parts[1])}`);
  }
}
