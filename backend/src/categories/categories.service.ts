import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from './../prisma/prisma.service';
import { IsNotEmpty } from 'class-validator';

export interface CategoryDto {
  id: number;
  name: string;
  parentId: number;
}

export class CategoryProperties {
  @IsNotEmpty()
  name: string;

  parentId?: number;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) { }

  toDto(category: Category): CategoryDto {
    const dto: CategoryDto = {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
    };
    return dto;
  }

  getAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  getOne(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  private transformProperties(
    props: Partial<CategoryProperties>,
  ): Promise<any> {
    const { parentId, ...data } = props as any;
    if (parentId) {
      data.parent = { connect: { id: props.parentId } };
    }
    return data;
  }

  async create(props: CategoryProperties): Promise<Category> {
    const data = await this.transformProperties(props);
    return this.prisma.category.create({ data });
  }

  async edit(
    id: number,
    props: Partial<CategoryProperties>,
  ): Promise<Category> {
    const data = await this.transformProperties(props);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  delete(id: number): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }
}
