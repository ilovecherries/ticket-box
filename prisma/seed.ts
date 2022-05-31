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
			name: "cs101",
		},
	});
	await prisma.tag.create({
		data: {
			name: "h240",
		},
	});
	await prisma.tag.create({
		data: {
			name: "urgent",
		},
	});
})()