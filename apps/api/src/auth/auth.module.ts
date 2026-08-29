import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './jwt.strategy';
import { SMS_PROVIDER, ISmsProvider } from './providers/sms.interface';
import { DevSmsProvider } from './providers/dev-sms.provider';
import { AfricaSmsProvider } from './providers/africastalking-sms.provider';

const smsProviderFactory = {
  provide: SMS_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): ISmsProvider => {
    const provider = config.get<string>('OTP_PROVIDER', 'dev');

    switch (provider) {
      case 'africas_talking':
        return new AfricaSmsProvider(config);
      case 'dev':
        return new DevSmsProvider();
      default:
        throw new Error(
          `Unknown OTP_PROVIDER: "${provider}". Valid values: "dev", "africas_talking"`,
        );
    }
  },
};

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    JwtStrategy,
    smsProviderFactory,
  ],
  exports: [AuthService],
})
export class AuthModule {}
