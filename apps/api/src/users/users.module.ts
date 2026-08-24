import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AddressesController } from './addresses.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, AddressesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
