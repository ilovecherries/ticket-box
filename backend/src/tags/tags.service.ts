import { Injectable } from '@nestjs/common';
import { Tag } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';
import { PrismaService } from './../prisma/prisma.service';

export interface TagDto {
  id: number;
  name: string;
}

export class TagProperties {
  @IsNotEmpty()
  name: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) { }

  toDto(category: Tag): TagDto {
    const dto: TagDto = {
      id: category.id,
      name: category.name,
    };
    return dto;
  }

  getAll(): Promise<Tag[]> {
    return this.prisma.tag.findMany();
  }

  getOne(id: number): Promise<Tag | null> {
    return this.prisma.tag.findUnique({ where: { id } });
  }

  async create(props: TagProperties): Promise<Tag> {
    return this.prisma.tag.create({ data: props });
  }

  async edit(id: number, props: Partial<TagProperties>): Promise<Tag> {
    return this.prisma.category.update({
      where: { id },
      data: props,
    });
  }

  delete(id: number): Promise<Tag> {
    return this.prisma.tag.delete({ where: { id } });
  }
}
