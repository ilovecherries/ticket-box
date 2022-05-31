import { Module } from '@nestjs/common';
import { PrismaModule } from './../prisma/prisma.module';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from './../users/users.module';

@Module({
  imports: [UsersModule, PrismaModule],
  providers: [PostsService],
  exports: [PostsService],
  controllers: [PostsController],
})
export class PostsModule {}
