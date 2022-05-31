import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from './../users/users.module';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { LoginStrategy } from './login.strategy';
import { RegisterStrategy } from './register.strategy';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AnonymousStrategy } from './anonymous.strategy';
import { PrismaModule } from './../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    PrismaModule,
  ],
  providers: [
    AuthService,
    LoginStrategy,
    RegisterStrategy,
    JwtStrategy,
    AnonymousStrategy,
  ],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
