import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { STORAGE_PROVIDER } from './providers/storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    { provide: STORAGE_PROVIDER, useClass: LocalStorageProvider },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
