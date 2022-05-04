import { PrismaClient, Category } from "@prisma/client";
import { IItemService } from "./IItemService";
import { CategoryView, CategoryProperties, CategoryEditProperties, toView } from "./category-types";

const prisma = new PrismaClient();

export class CategoryService implements IItemService<
	CategoryView,
	CategoryProperties,
	CategoryEditProperties
> {
	private readonly toView: (props: Category) => CategoryView

	constructor() {
		this.toView = toView;
	}

	async create(props: CategoryProperties): Promise<CategoryView> {
		const data: any = { ...props };
		const item = await prisma.category.create({ data });
		return this.toView(item);
	}

	async edit(id: number, props: CategoryEditProperties): Promise<CategoryView> {
		const data: any = { ...props };
		const item = await prisma.category.update({
			where: { id },
			data,
		});
		return this.toView(item);
	}

	async delete(id: number) {
		await prisma.category.delete({
			where: { id },
		});
	}

	// async deleteByName(name: string) {
	// 	await prisma.category.delete({
	// 		where: { name },
	// 	});
	// }

	async getAll(): Promise<CategoryView[]> {
		const items = await prisma.category.findMany();
		return items.map(this.toView);
	}

	async getOne(id: number): Promise<CategoryView> {
		const data = await prisma.category.findUnique({
			where: { id },
		});
		if (data) {
			return this.toView(data);
		} else {
			throw new Error("Category was not found.");
		}
	}
}
