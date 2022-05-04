set name $argv[1]
set lowername (string lower $name)
set typefile services/$lowername-types.ts
# you /will/ need to modify this file
if not test -e $typefile
	echo "\
import { "$name" } from \"@prisma/client\";

export type "$name"View = {
	/* fill this in */
};

export type "$name"Properties = {
	/* fill this in */
};

export type "$name"EditProperties = {
	/* fill this in */
};

export const toView = (props: "$name"): "$name"View => {
	const view = {
		/* fill this in */
	};
	return view;
};" > $typefile
end
echo "\
import { "$name"Service } from \"../services/"$lowername"\";

const "$lowername"Service = new "$name"Service();

import TI from \"../services/"$lowername"-types-ti\";
import { createCheckers } from \"ts-interface-checker\";
import generateItemRoute from \"./item-route\";
const checkers = createCheckers(TI);

const router = generateItemRoute(
	"$lowername"Service,
	checkers."$name"Properties,
	checkers."$name"EditProperties,
);

export default router;" > "routes/"$lowername"s.ts"
# this is the main file that you do not need to touch at ALL
echo "\
import { PrismaClient, "$name" } from \"@prisma/client\";
import { IItemService } from \"./IItemService\";
import { "$name"View, "$name"Properties, "$name"EditProperties, toView } from \"./"$lowername"-types\";

const prisma = new PrismaClient();

export class "$name"Service implements IItemService<
	"$name"View,
	"$name"Properties,
	"$name"EditProperties
> {
	private readonly toView: (props: "$name") => "$name"View

	constructor() {
		this.toView = toView;
	}

	async create(props: "$name"Properties): Promise<"$name"View> {
		const data: any = { ...props };
		const item = await prisma."$lowername".create({ data });
		return this.toView(item);
	}

	async edit(id: number, props: "$name"EditProperties): Promise<"$name"View> {
		const data: any = { ...props };
		const item = await prisma."$lowername".update({
			where: { id },
			data,
		});
		return this.toView(item);
	}

	async delete(id: number) {
		await prisma."$lowername".delete({
			where: { id },
		});
	}

	async deleteByName(name: string) {
		await prisma."$lowername".delete({
			where: { name },
		});
	}

	async getAll(): Promise<"$name"View[]> {
		const items = await prisma."$lowername".findMany();
		return items.map(this.toView);
	}

	async getOne(id: number): Promise<"$name"View> {
		const data = await prisma."$lowername".findUnique({
			where: { id },
		});
		if (data) {
			return this.toView(data);
		} else {
			throw new Error(\""$name" was not found.\");
		}
	}
}" > services/$lowername.ts