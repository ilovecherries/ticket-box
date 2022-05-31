import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from './../prisma/prisma.service';

export interface UserDto {
  id: number;
  username: string;
  admin: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toDto(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      admin: user.admin,
    } as UserDto;
  }

  async setAdmin(username: string, isAdmin: boolean) {
    await this.prisma.user.update({
      where: { username },
      data: { admin: isAdmin },
    });
  }

  create(username: string, password: string): Promise<User> {
    return this.prisma.user.create({
      data: { username, password },
    });
  }

  getById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  getByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  deleteByUsername(username: string): Promise<User> {
    return this.prisma.user.delete({
      where: { username },
    });
  }
}
