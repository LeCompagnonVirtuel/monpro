import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({
  controllers: [AdminController, DisputesController],
  providers: [AdminService, DisputesService],
})
export class AdminModule {}
