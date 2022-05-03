import { Router } from "express";
import { VoteService } from "../services/vote";

const router = Router()

const voteService = new VoteService();

import voteTI from "../services/vote-ti";
import { createCheckers } from "ts-interface-checker";
import { qAuthCheck } from "../utils/auth";
const voteCheckers = createCheckers(voteTI);

router.post("/", async (req, res) => {
  try {
    await qAuthCheck(res, req.user, async () => {
      const { body } = req;
      voteCheckers.VoteProperties.check(body);
      const vote = await voteService.vote(body, req.user!.id);
      res.json(vote)
    })
  } catch (e) {
    res.status(400);
    res.send(e);
  }
});

export default router;