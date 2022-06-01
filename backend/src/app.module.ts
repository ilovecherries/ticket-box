import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { PostsModule } from './posts/posts.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsService } from './tags/tags.service';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, PostsModule, CategoriesModule, TagsModule],
  controllers: [AppController],
  providers: [AppService, TagsService],
})
export class AppModule {}
