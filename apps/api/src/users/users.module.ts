import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AddressesController } from './addresses.controller';
import { UsersService } from './users.service';
import { AddressesService } from './addresses.service';

@Module({
  controllers: [UsersController, AddressesController],
  providers: [UsersService, AddressesService],
  exports: [UsersService],
})
export class UsersModule {}
