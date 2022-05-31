import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class RegisterStrategy extends PassportStrategy(Strategy, 'signup') {
  private readonly logger = new Logger(RegisterStrategy.name);

  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    try {
      const user = await this.authService.register(username, password);
      return user;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException(
          'A user with this username already exists',
        );
      } else {
        this.logger.error(e);
        throw new InternalServerErrorException();
      }
    }
  }
}
