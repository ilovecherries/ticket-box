import { Module } from '@nestjs/common';
import { UsersModule } from './../users/users.module';
import { PrismaModule } from './../prisma/prisma.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
