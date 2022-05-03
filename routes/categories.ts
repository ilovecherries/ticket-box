import { Router } from "express";
import { CategoryEditProperties, CategoryProperties, CategoryService } from "../services/category";
import { UserService } from "../services/user";

const router = Router();

const categoryService = new CategoryService();
const userService = new UserService();

import categoryTI from "../services/category-ti";
import { createCheckers } from "ts-interface-checker";
import { qAuthCheck } from "../utils/auth";
const categoryCheckers = createCheckers(categoryTI);

router.get("/", async (_, res) => {
  try {
    res.json(await categoryService.getAll());
  } catch (e) {
    res.status(500);
    res.send(e);
  }
});

router.get("/:id([0-9]+)", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    res.json(await categoryService.getOne(id));
  } catch (e) {
    res.status(500);
    res.send(e);
  }
});

router.post("/", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const user = await userService.getById(req.user!.id);
      await qAuthCheck(res, user.admin, async () => {
        const { body } = req;
        categoryCheckers.CategoryProperties.check(body);
        const data: CategoryProperties = body;
        const category = await categoryService.create(data);
        res.status(201);
        res.json(category);
      })
    } catch (e) {
      res.status(400);
      res.send(e);
    }
  });
});

router.put("/:id([0-9]+)", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const user = await userService.getById(req.user!.id);
      await qAuthCheck(res, user.admin, async () => {
        const id = parseInt(req.params.id);
        const { body } = req;
        categoryCheckers.CategoryEditProperties.check(body);
        const data: CategoryEditProperties = body;
        const category = await categoryService.edit(id, data);
        res.json(category);
      })
    } catch (e) {
      res.status(400);
      res.send(e);
    }
  });
});

router.delete("/:id([0-9]+)", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const user = await userService.getById(req.user!.id);
      await qAuthCheck(res, user.admin, async () => {
        const id = parseInt(req.params.id);
        await categoryService.delete(id);
        res.status(204);
        res.json();
      })
    } catch (e) {
      res.status(400);
      res.send(e);
    }
  });
});

export default router;