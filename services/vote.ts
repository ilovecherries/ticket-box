import { PrismaClient, Vote } from "@prisma/client";

const prisma = new PrismaClient();

export enum VoteValue {
  DownVote = -1,
  NoVote = 0,
  UpVote = 1,
}

export type VoteView = {
  postId: number,
  score: number,
  myScore?: VoteValue,
};

export type VoteProperties = {
  postId: number,
  score: VoteValue,
};

export class VoteService {
  private toView(vote: Vote, score: number): VoteView {
    return {
      postId: vote.postId,
      score: score,
      myScore: vote.score,
    };
  }

  async vote(props: VoteProperties, userId: number): Promise<VoteView> {
    const vote = await prisma.vote.upsert({
      where: { voterId_postId: { voterId: userId, postId: props.postId} },
      update: {
        score: props.score
      },
      create: {
        voter: {
          connect: { id: userId }
        },
        post: {
          connect: { id: props.postId }
        },
        score: props.score
      },
    });
    const score = await this.getScore(props.postId);
    return this.toView(vote, score);
  }

  async getScore(postId: number): Promise<number> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { votes: true },
    });
    if (post) {
      return post.votes.reduce((a, b) => a + b.score, 0);
    } else {
      throw new Error("Could not find post to get score.");
    }
  }

  async getUserScore(postId: number, userId: number): Promise<number> {
    const vote = await prisma.vote.findUnique({
      where: {
        voterId_postId: {
          voterId: userId,
          postId,
        }
      },
    });
    return vote?.score || 0;
  }
}