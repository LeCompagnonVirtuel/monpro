import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceTokensService } from './device-tokens.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@ApiTags('Device Tokens')
@Controller('device-tokens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceTokensController {
  constructor(private deviceTokensService: DeviceTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Enregistrer un token de notification' })
  register(
    @CurrentUser('id') userId: string,
    @Body() body: RegisterDeviceTokenDto,
  ) {
    return this.deviceTokensService.register(userId, body);
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Supprimer un token de notification' })
  unregister(@CurrentUser('id') userId: string, @Param('token') token: string) {
    return this.deviceTokensService.unregister(userId, token);
  }
}
