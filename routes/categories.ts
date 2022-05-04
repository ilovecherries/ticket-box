import { CategoryService } from "../services/category";

const categoryService = new CategoryService();

import TI from "../services/category-types-ti";
import { createCheckers } from "ts-interface-checker";
import generateItemRoute from "./item-route";
const checkers = createCheckers(TI);

const router = generateItemRoute(
	categoryService,
	checkers.CategoryProperties,
	checkers.CategoryEditProperties,
);

export default router;
