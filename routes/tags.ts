import { TagService } from "../services/tag";

const tagService = new TagService();

import TI from "../services/tag-types-ti";
import { createCheckers } from "ts-interface-checker";
import generateItemRoute from "./item-route";
const checkers = createCheckers(TI);

const router = generateItemRoute(
	tagService,
	checkers.TagProperties,
	checkers.TagEditProperties,
);

export default router;
