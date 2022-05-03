
import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

export type CategoryView = {
  id: number,
  title: string,
  parentId?: number
};

export type CategoryProperties = {
  title: string,
  parentId?: number
};

export type CategoryEditProperties = {
  title?: string,
  parentId?: number
};

export class CategoryService {
  private toView(category: Category): CategoryView {
    const view: CategoryView = {
      id: category.id,
      title: category.title,
      parentId: category.parentId || undefined,
    }
    return view;
  }

  async create(category: CategoryProperties): Promise<CategoryView> {
    let data: any = { ...category };
    if (data.parentId) {
      data.parent = { connect: { id: category.parentId } };
      delete data.parentId;
    }
    const created = await prisma.category.create({ data });
    return this.toView(created);
  }

  async edit(id: number, category: CategoryEditProperties): Promise<CategoryView> {
    let data: any = { ...category };
    if (data.parentId) {
      data.parent = { connect: { id: category.parentId } };
      delete data.parentId;
    }
    const created = await prisma.category.update({
      where: { id },
      data
    });
    return this.toView(created);
  }

  async delete(id: number) {
    await prisma.category.delete({
      where: { id },
    });
  }

  async getAll(): Promise<CategoryView[]> {
    const categories = await prisma.category.findMany();
    return categories.map(this.toView);
  }

  async getOne(id: number): Promise<CategoryView> {
    const data = await prisma.category.findUnique({
      where: { id }
    });
    if (data) {
      return this.toView(data);
    } else {
      throw new Error("Category not found.");
    }
  }
}