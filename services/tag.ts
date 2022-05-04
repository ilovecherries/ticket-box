import { PrismaClient, Tag } from "@prisma/client";
import { IItemService } from "./IItemService";
import { TagView, TagProperties, TagEditProperties, toView } from "./tag-types";

const prisma = new PrismaClient();

export class TagService implements IItemService<
	TagView,
	TagProperties,
	TagEditProperties
> {
	private readonly toView: (props: Tag) => TagView

	constructor() {
		this.toView = toView;
	}

	async create(props: TagProperties): Promise<TagView> {
		const data: any = { ...props };
		const item = await prisma.tag.create({ data });
		return this.toView(item);
	}

	async edit(id: number, props: TagEditProperties): Promise<TagView> {
		const data: any = { ...props };
		const item = await prisma.tag.update({
			where: { id },
			data,
		});
		return this.toView(item);
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
		const items = await prisma.tag.findMany();
		return items.map(this.toView);
	}

	async getOne(id: number): Promise<TagView> {
		const data = await prisma.tag.findUnique({
			where: { id },
		});
		if (data) {
			return this.toView(data);
		} else {
			throw new Error("Tag was not found.");
		}
	}
}
