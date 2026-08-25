import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { IStorageProvider, StorageFile } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  async upload(file: StorageFile, folder: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, file.filename);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${folder}/${file.filename}`;
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = path.join(process.cwd(), filePath.replace(/^\//, ''));
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}
