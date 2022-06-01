import { Module } from '@nestjs/common';
import { PrismaModule } from './../prisma/prisma.module';
import { UsersModule } from './../users/users.module';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  providers: [TagsService],
  controllers: [TagsController],
})
export class TagsModule {}
