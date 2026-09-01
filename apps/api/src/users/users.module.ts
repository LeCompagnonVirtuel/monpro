import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AddressesController } from './addresses.controller';
import { ProfessionalServicesController } from './professional-services.controller';
import { UsersService } from './users.service';
import { AddressesService } from './addresses.service';
import { ProfessionalServicesService } from './professional-services.service';

@Module({
  controllers: [UsersController, AddressesController, ProfessionalServicesController],
  providers: [UsersService, AddressesService, ProfessionalServicesService],
  exports: [UsersService],
})
export class UsersModule {}
