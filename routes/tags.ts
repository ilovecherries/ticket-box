import { Router } from "express";
import { TagEditProperties, TagProperties, TagService } from "../services/tag";
import { UserService } from "../services/user";

const router = Router();

const tagService = new TagService();
const userService = new UserService();

import tagTI from "../services/tag-ti";
import { createCheckers } from "ts-interface-checker";
import { qAuthCheck } from "../utils/auth";
const tagCheckers = createCheckers(tagTI);

router.get("/", async (_, res) => {
  try {
    res.json(await tagService.getAll());
  } catch (e) {
    res.status(500);
    res.send(e);
  }
});

router.get("/:id([0-9]+)", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    res.json(await tagService.getOne(id));
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
        tagCheckers.TagProperties.check(body);
        const data: TagProperties = body;
        const tag = await tagService.create(data);
        res.status(201);
        res.json(tag);
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
        tagCheckers.TagEditProperties.check(body);
        const data: TagEditProperties = body;
        const tag = await tagService.edit(id, data);
        res.json(tag);
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
        await tagService.delete(id);
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