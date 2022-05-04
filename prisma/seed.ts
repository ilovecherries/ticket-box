import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
	await prisma.category.create({
		data: {
			name: "Root Category",
		},
	});
	await prisma.tag.create({
		data: {
			name: "pinkie-pie",
		},
	});
	await prisma.tag.create({
		data: {
			name: "starlight-glimmer",
		},
	});
})()