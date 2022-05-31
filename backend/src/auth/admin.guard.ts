import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from '.././users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    return user ? (await this.usersService.getById(user.userId)).admin : false;
  }
}
