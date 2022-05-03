import { PrismaClient, Tag } from "@prisma/client";

const prisma = new PrismaClient();

export type TagView = {
  id: number,
  name: string,
};

export type TagProperties = {
  name: string,
};

export type TagEditProperties = {
  name?: string,
};

export class TagService {
  private toView(tag: Tag): TagView {
    const view: TagView = {
      id: tag.id,
      name: tag.name,
    }
    return view;
  }

  async create(tag: TagProperties): Promise<TagView> {
    let data: any = { ...tag };
    const created = await prisma.tag.create({ data });
    return this.toView(created);
  }

  async edit(id: number, tag: TagEditProperties): Promise<TagView> {
    let data: any = { ...tag };
    const created = await prisma.tag.update({
      where: { id },
      data
    });
    return this.toView(created);
  }

  async delete(id: number) {
    await prisma.tag.delete({
      where: { id },
    });
  }

  async deleteByName(name: string) {
    await prisma.tag.delete({
      where: { name },
    });
  }

  async getAll(): Promise<TagView[]> {
    const categories = await prisma.tag.findMany();
    return categories.map(this.toView);
  }

  async getOne(id: number): Promise<Tag> {
    const data = await prisma.tag.findUnique({
      where: { id }
    });
    if (data) {
      return this.toView(data);
    } else {
      throw new Error("Tag not found.");
    }
  }
}