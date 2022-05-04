import { Category } from "@prisma/client";

export type CategoryView = {
	id: number,
	name: string,
	parentId?: number
};

export type CategoryProperties = {
	name: string,
	parentId?: number
};

export type CategoryEditProperties = {
	name?: string,
	parentId?: number
};

export const toView = (props: Category): CategoryView => {
	const view = {
		id: props.id,
      name: props.name,
      parentId: props.parentId || undefined,
	};
	return view;
};
