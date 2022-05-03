import { Router } from "express";
import { PostEditProperties, PostProperties, PostService } from "../services/post";
import { UserService } from "../services/user";

const router = Router();

const userService = new UserService();
const postService = new PostService();

import postTI from "../services/post-ti";
import { createCheckers } from "ts-interface-checker";
import { qAuthCheck } from "../utils/auth";
const postCheckers = createCheckers(postTI);

router.get('/', async (req, res) => {
  try {
    if (req.user) {
      const user = await userService.getById(req.user.id);
      const posts = await postService.getAll(user.admin, user.id);
      res.json(posts);
    } else {
      const posts = await postService.getAll();
      res.json(posts);
    }
  } catch (e) {
    res.status(500);
    res.send(e);
  }
});

router.get("/:id([0-9]+)", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user) {
      const user = await userService.getById(req.user.id);
      const post = await postService.getOne(id, user.admin, user.id);
      res.json(post)
    } else {
      const post = await postService.getOne(id);
      res.json(post)
    }
  } catch (e) {
    res.status(400);
    res.send(e);
  }
});

router.post("/", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const { body } = req;
      postCheckers.PostProperties.check(body);
      const data: PostProperties = body;
      const user = await userService.getById(req.user!.id);
      const post = await postService.create(user.id, data, user.admin);
      res.status(201);
      res.json(post);
    } catch (e) {
      console.log(e)
      res.status(400);
      res.send(e);
    }
  });
});

router.put("/:id([0-9]+)", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const id = parseInt(req.params.id);
      const { body } = req;
      postCheckers.PostEditProperties.check(body);
      const data: PostEditProperties = body;
      const user = await userService.getById(req.user!.id);
      const post = await postService.getOne(id, true);
      qAuthCheck(res, user.id === post.authorId || user.admin, async () => {
        const edited = await postService.edit(id, data, user.admin, user.id);
        res.json(edited);
      });
    } catch (e) {
      res.status(400);
      res.send(e);
    }
  });
});

router.delete("/:id([0-9]+)", async (req, res) => {
  await qAuthCheck(res, req.user, async () => {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getById(req.user!.id);
      const post = await postService.getOne(id, true);
      qAuthCheck(res, user.id === post.authorId || user.admin, async () => {
        await postService.delete(id);
        res.status(204);
        res.send()
      });
    } catch (e) {
      res.status(400);
      res.send(e);
    }
  });
});

export default router;