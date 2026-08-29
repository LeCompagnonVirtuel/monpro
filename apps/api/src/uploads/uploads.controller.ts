import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { memoryStorage } from 'multer';

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('image')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Upload une image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Body('folder') folder?: string) {
    const url = await this.uploadsService.uploadFile(file, folder || 'general');
    return { url };
  }

  @Post('images')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Upload plusieurs images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[], @Body('folder') folder?: string) {
    const urls = await Promise.all(
      files.map((file) => this.uploadsService.uploadFile(file, folder || 'general')),
    );
    return { urls };
  }
}
