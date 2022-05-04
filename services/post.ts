import { PrismaClient, Post, Vote, PostTagRelationship } from "@prisma/client";

const prisma = new PrismaClient();

export type PostView = {
  id: number,
  content: string,
  name: string,
  categoryId: number,
  score: number,
  authorId?: number
  myScore?: number,
  mine?: boolean,
  tags?: Array<number>,
};

export type PostRestrictedView = {
  id: number,
  content: string,
  categoryId: number,
  name: string,
  score: number,
  myScore?: number,
  mine?: boolean,
  tags?: Array<number>,
}

/***
  * The properties in a post that can be set or edited.
  **/
export type PostProperties = {
  content: string,
  name: string,
  categoryId: number,
  tags?: Array<number>,
};

export type PostEditProperties = {
  content?: string,
  name?: string,
  categoryId?: number,
  tags?: Array<number>,
};

export type PostSearch = {
  categoryId?: number,
};

export class PostService {
  private toView(post: Post & { votes?: Vote[], PostTagRelationship?: PostTagRelationship[] }, receiverId?: number): PostView {
    let view: PostView = {
      id: post.id,
      content: post.content,
      name: post.name,
      categoryId: post.categoryId,
      authorId: post.authorId || undefined,
      score: post.votes?.reduce((a, b) => a + b.score, 0) || 0,
      tags: post.PostTagRelationship?.map(x => x.tagId),
    };
    if (receiverId) {
      view.myScore = post.votes?.find(x => x.voterId === receiverId)?.score || 0;
      view.mine = view.authorId === receiverId;
    }
    return view;
  }

  private toRestrictedView(post: Post & { votes?: Vote[], PostTagRelationship?: PostTagRelationship[] }, receiverId?: number): PostRestrictedView {
    const view = this.toView(post, receiverId);
    let restrictedView: PostRestrictedView = {
      id: view.id,
      content: view.content,
      name: view.name,
      categoryId: view.categoryId,
      score: view.score,
      tags: view.tags,
    };
    if (view.myScore !== undefined) {
      restrictedView.myScore = view.myScore;
    }
    if (view.mine !== undefined) {
      restrictedView.mine = view.mine;
    }
    return restrictedView;
  }

  async create(authorId: number, post: PostProperties, admin?: boolean): Promise<PostView | PostRestrictedView> {
    if (post.tags) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: post.tags } }
      });
      if (post.tags.length !== tags.length) {
        throw new Error("One or more of the tags attached to the post do not exist.");
      }
    }
    const properties = {
      name: post.name,
      content: post.content,
    };
    const data = await prisma.post.create({
      data: {
        ...properties,
        category: {
          connect: {
            id: post.categoryId
          },
        },
        author: {
          connect: {
            id: authorId
          }
        },
      },
    });
    if (post.tags) {
      for (const x of post.tags) {
        await prisma.postTagRelationship.create({
              data: {
                post: {
                  connect: {
                    id: data.id,
                  },
                },
                tag: {
                  connect: {
                    id: x,
                  },
                },
              },
            })
      }
    }
    const result = await prisma.post.findUnique({
      where: { id: data.id },
      include: { votes: true, PostTagRelationship: true },
    });
    if (result) {
      return admin ? this.toView(result, authorId) : this.toRestrictedView(result, authorId);
    } else {
      throw new Error("Internal database error");
    }
  }

  async edit(id: number, post: PostEditProperties, admin?: boolean, userId?: number): Promise<PostView | PostRestrictedView> {
    await prisma.postTagRelationship.deleteMany({
      where: { postId: id },
    });
    if (post.tags) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: post.tags } }
      });
      if (post.tags.length !== tags.length) {
        throw new Error("One or more of the tags attached to the post do not exist.");
      }
    }
    let properties: any = {
      name: post.name,
      content: post.content,
    };
    if (properties.categoryId) {
      properties.category = { connect: { id: post.categoryId } };
      delete properties.categoryId;
    }
    const data = await prisma.post.update({
      where: { id },
      data: properties,
      include: { votes: true }
    });
    if (post.tags) {
      for (const x of post.tags) {
        await prisma.postTagRelationship.create({
              data: {
                post: {
                  connect: {
                    id: data.id,
                  },
                },
                tag: {
                  connect: {
                    id: x,
                  },
                },
              },
            })
      }
    }
    const result = await prisma.post.findUnique({
      where: { id },
      include: { votes: true, PostTagRelationship: true },
    });
    if (result) {
      return admin ? this.toView(result, userId) : this.toRestrictedView(result, userId);
    } else {
      throw new Error("Internal database error");
    }
  }

  async delete(id: number) {
    await prisma.post.delete({
      where: { id },
    });
  }

  async getAll(admin?: boolean, userId?: number): Promise<PostView[] | PostRestrictedView[]> {
    const posts = await prisma.post.findMany({
      include: { votes: true, PostTagRelationship: true, },
    });
    if (admin) return posts.map(x => this.toView(x, userId));
    else return posts.map(x => this.toRestrictedView(x, userId));
  }

  async getOne(id: number, admin?: boolean, userId?: number): Promise<PostView> {
    const data = await prisma.post.findUnique({
      where: { id },
      include: { votes: true, PostTagRelationship: true, },
    });
    if (data) {
      return admin ? this.toView(data, userId) : this.toRestrictedView(data, userId);
    } else {
      throw new Error("Post not found.");
    }
  }
}
