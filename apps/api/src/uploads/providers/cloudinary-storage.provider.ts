import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { IStorageProvider, StorageFile } from './storage.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider, OnModuleInit {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  onModuleInit() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.logger.log('Cloudinary configured');
  }

  async upload(file: StorageFile, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `monpro/${folder}`,
          public_id: file.filename.replace(/\.[^.]+$/, ''),
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  async delete(path: string): Promise<void> {
    const publicId = path
      .replace(/^uploads\//, 'monpro/')
      .replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  }
}
