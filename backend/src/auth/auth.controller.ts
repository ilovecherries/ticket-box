import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './../users/users.service';
import { AuthService, UserCredentials } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginAuthGuard } from './login-auth.guard';

@Controller({
  path: 'auth',
  version: '2',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @UsePipes(ValidationPipe)
  async register(@Body() req: UserCredentials) {
    return this.usersService.toDto(
      await this.authService.register(req.username, req.password),
    );
  }

  @UseGuards(LoginAuthGuard)
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }
}
