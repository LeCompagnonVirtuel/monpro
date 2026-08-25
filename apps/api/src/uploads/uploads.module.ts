import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { STORAGE_PROVIDER } from './providers/storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';

const storageProvider = {
  provide: STORAGE_PROVIDER,
  useClass: process.env.STORAGE_PROVIDER === 'cloudinary'
    ? CloudinaryStorageProvider
    : LocalStorageProvider,
};

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, storageProvider],
  exports: [UploadsService],
})
export class UploadsModule {}
