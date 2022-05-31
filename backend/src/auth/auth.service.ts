import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { UsersService } from './../users/users.service';

export interface UserCredentials {
  username: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(username: string, password: string): Promise<User> {
    return this.usersService.create(username, password);
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.getByUsername(username);
    if (user && user.password === password) {
      const result = this.usersService.toDto(user);
      return result;
    }
    return null;
  }

  login(user: any): { access_token: string } {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
