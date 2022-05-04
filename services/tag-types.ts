import { Tag } from "@prisma/client";

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

export const toView = (props: Tag): TagView => {
	const view = {
		id: props.id,
		name: props.name,
	};
	return view;
};
