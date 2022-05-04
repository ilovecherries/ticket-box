import { PostProperties, PostService } from "../services/post";
import postTI from "../services/post-ti";
import categoryTI from "../services/category-types-ti";
import tagTI from "../services/tag-types-ti";
import request from "supertest";
import { createCheckers } from "ts-interface-checker";
import server from "../index";
import { UserCredentials } from "../services/user";
import { UserService } from "../services/user";
import { CategoryService } from "../services/category";
import { VoteProperties } from "../services/vote";
import { TagService } from "../services/tag";
import { prisma } from "@prisma/client";

const userService = new UserService();
const categoryService = new CategoryService();
const tagService = new TagService();

const app = request(server);

afterAll(() => {
  server.close();
});

const registerPath = "/api/v1/register";
const loginPath = "/api/v1/login";
const mePath = "/api/v1/me";
const categoryPath = "/api/v1/categories";
const tagPath = "/api/v1/tags";
const postPath = "/api/v1/posts";
const votePath = "/api/v1/votes";

const username = "Quandale";
const password = "Dingle";

const username2 = "Applejack";
const username3 = "Fluttershy";

const login = async (username: string, password: string): Promise<string> => {
  const res = await app 
    .post(loginPath)
    .send({ username, password })
    .expect(200);
  return res.body.token;
}

type RequestFactoryFunction = (
  token: string, 
  data: any,
  callback?: request.CallbackHandler | undefined, 
  expected?: number
) => void

type GetOneFactoryFunction = (
  token: string, 
  id: number,
  callback?: request.CallbackHandler | undefined, 
  expected?: number
) => void

const postFactory = (
  path: string,
  expecting: number = 201,
): RequestFactoryFunction => {
  return (
    token: string,
    data: any,
    callback?: request.CallbackHandler | undefined,
    expected: number = expecting
  ) => {
    app.post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(expected, callback);
  }
}

const getOneFactory = (
  path: string,
  expecting: number = 200,
): GetOneFactoryFunction => {
  return (
    token: string,
    id: number,
    callback?: request.CallbackHandler | undefined,
    expected: number = expecting,
  ) => {
    app.get(`${path}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(expected, callback);
  }
}

const createCategory = postFactory(categoryPath);
const createTag = postFactory(tagPath);
const createPost = postFactory(postPath);
const getOnePost = getOneFactory(postPath);

describe("users related tests", () => {
  afterEach(async () => {
    try {
      await userService.deleteByUsername(username);
    } catch (e) { }
  })

  test("registering user", async () => {
    try {
      await userService.deleteByUsername(username);
    } catch (e) { }
    const data: UserCredentials = { username, password, };
    await app
      .post(registerPath)
      .send(data)
      .expect(201);
  });

  test("attempt to get user data while logged out", async () => {
    const res = await request(server)
      .get(mePath);
    expect(res.status).toBe(401);
  });

  test("logging in user", async () => {
    try {
      await userService.register(username, password)
    } catch (e) { }
    const data: UserCredentials = { username, password, };
    const res = await app
      .post(loginPath)
      .send(data);
    expect(res.status).toBe(200);
  });

  describe("logged in user tests", () => {
    let token: string;

    beforeAll(async () => {
      try {
        await userService.register(username, password)
      } catch (e) { }
      const data: UserCredentials = { username, password };
      const res = await app
        .post(loginPath)
        .send(data)
        .expect(200);

      token = res.body.token;
    });

    afterAll(async () => {
      try {
        await userService.deleteByUsername(username);
      } catch (e) { }
    })

    test("getting user data while logged in", (done) => {
      app
        .get(mePath)
        .set('Authorization', `Bearer ${token}`)
        .expect(200, done);
    });
  });
})

describe("categories related tests", () => {
  const checkers = createCheckers(categoryTI);

  let token: string;
  let admin_token: string;

  beforeAll(async () => {
    try {
      await userService.register(username, password)
      const admin = await userService.register(username3, password)
      await userService.setAdmin(admin.id, true);
    } catch (e) { }
    token = await login(username, password);
    admin_token = await login(username3, password);
  });

  afterAll(async () => {
    try {
      await userService.deleteByUsername(username);
      await userService.deleteByUsername(username3);
    } catch (e) { }
  })

  const editCategory = (
    token: string, 
    id: number,
    data: any,
    callback?: request.CallbackHandler | undefined, 
    expected: number = 200,
  ) => {
    app
      .put(`${categoryPath}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(expected, callback);
  }

  const deleteCategory = (
    token: string, 
    id: number,
    callback?: request.CallbackHandler | undefined, 
    expected: number = 200,
  ) => {
    app
      .delete(`${categoryPath}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(expected, callback);
  }

  const name = "My Category";
  const sampleCategory = { name };

  const name2 = "My Next Category";
  const sampleEdit = { name: name2 };

  test("failing to create a category while not signed in", (done) =>
    createCategory("", sampleCategory, done, 401));

  test("failing to create a category with a normal user", (done) =>
    createCategory(token, sampleCategory, done, 401));

  test("creating a category with an admin user", (done) =>
    createCategory(admin_token, sampleCategory, async (err, res) => {
      if (err) return done(err);
      checkers.CategoryView.check(res.body);
      await categoryService.delete(res.body.id);
      done();
    }, 201));

  describe("editing a category", () => {
    let categoryId: number;

    beforeAll(async () => {
      const category = await categoryService.create(sampleCategory);
      categoryId = category.id;
    })

    afterAll(async () => {
      try {
        await categoryService.delete(categoryId);
      } catch (e) {}
    })

    test("failing to edit a category while not signed in", (done) =>
      editCategory("", categoryId, sampleCategory, done, 401));

    test("failing to edit a category with a normal user", (done) =>
      editCategory(token, categoryId, sampleCategory, done, 401));

    test("editing a category with an admin user", (done) =>
      editCategory(admin_token, categoryId, sampleCategory, async (err, res) => {
        if (err) return done(err);
        checkers.CategoryView.check(res.body);
        await categoryService.delete(res.body.id);
        done();
      }, 200));
  });

  describe("deleting a category", () => {
    let categoryId: number;

    beforeAll(async () => {
      const category = await categoryService.create(sampleCategory);
      categoryId = category.id;
    })

    afterAll(async () => {
      try {
        await categoryService.delete(categoryId);
      } catch (e) {}
    })

    test("failing to delete a category while not signed in", (done) =>
      deleteCategory("", categoryId, done, 401));

    test("failing to delete a category with a normal user", (done) =>
      deleteCategory(token, categoryId, done, 401));

    test("deleting a category with an admin user", (done) =>
      deleteCategory(admin_token, categoryId, done, 204));
  });
})

describe("tags related tests", () => {
  const checkers = createCheckers(tagTI);

  let token: string;
  let admin_token: string;

  const name = "my-tag";
  const sampleTag = { name };

  const name2 = "my-tag-edit";
  const sampleEdit = { name: name2 };

  beforeAll(async () => {
    try {
      await userService.register(username, password)
      const admin = await userService.register(username3, password)
      await userService.setAdmin(admin.id, true);
    } catch (e) { }
    token = await login(username, password);
    admin_token = await login(username3, password);
  });

  afterAll(async () => {
    try {
      await userService.deleteByUsername(username);
      await userService.deleteByUsername(username3);
    } catch (e) { }
  })

  const editTag = (
    token: string, 
    id: number,
    data: any,
    callback?: request.CallbackHandler | undefined, 
    expected: number = 200,
  ) => {
    app
      .put(`${tagPath}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(expected, callback);
  }

  const deleteTag = (
    token: string, 
    id: number,
    callback?: request.CallbackHandler | undefined, 
    expected: number = 200,
  ) => {
    app
      .delete(`${tagPath}/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(expected, callback);
  }

  describe("creating a tag", () => {
    const deleteTags = async () => {
      try {
        await tagService.deleteByName(name);
        await tagService.deleteByName(name2);
      } catch (_) {}
    }

    beforeAll(deleteTags)
    afterAll(deleteTags)

    test("failing to create a tag while not signed in", (done) =>
      createTag("", sampleTag, done, 401));

    test("failing to create a tag with a normal user", (done) =>
      createTag(token, sampleTag, done, 401));

    test("creating a tag with an admin user", (done) =>
      createTag(admin_token, sampleTag, async (err, res) => {
        if (err) return done(err);
        checkers.TagView.check(res.body);
        done();
      }, 201));
  })
  describe("editing a tag", () => {
    let tagId: number;

    beforeAll(async () => {
      const tag = await tagService.create(sampleTag);
      tagId = tag.id;
    })

    afterAll(async () => {
      try {
        await categoryService.delete(tagId);
      } catch (e) {}
    })

    test("failing to edit a category while not signed in", (done) =>
      editTag("", tagId, sampleEdit, done, 401));

    test("failing to edit a category with a normal user", (done) =>
      editTag(token, tagId, sampleEdit, done, 401));

    test("editing a tag with an admin user", (done) =>
      editTag(admin_token, tagId, sampleEdit, async (err, res) => {
        if (err) return done(err);
        checkers.TagView.check(res.body);
        await tagService.delete(res.body.id);
        done();
      }, 200));
  });

  describe("deleting a tag", () => {
    let tagId: number;

    beforeAll(async () => {
      const tag = await tagService.create(sampleTag);
      tagId = tag.id;
    })

    afterAll(async () => {
      try {
        await tagService.delete(tagId);
      } catch (e) {}
    })

    test("failing to delete a category while not signed in", (done) =>
      deleteTag("", tagId, done, 401));

    test("failing to delete a category with a normal user", (done) =>
      deleteTag(token, tagId, done, 401));

    test("deleting a category with an admin user", (done) =>
      deleteTag(admin_token, tagId, done, 204));
  });
})

describe("posts related tests", () => {
  const checkers = createCheckers(postTI);
  const path = "/api/v1/posts";

  const content = "Hello, World!";
  const name = "Hello, World!";
  
  const tag1 = "My Epic Tag";
  const tag2 = "My Very Epic Tag";

  let samplePost: PostProperties = {
    content, name,
    categoryId: 0,
  };

  test("failing to create a post while not signed in", (done) =>
    createPost("", samplePost, done, 401));

  test("check if get returns posts properly", async () => {
    const res = await request(server)
      .get(path)
      .expect(200);
    const { body } = res;
    if (Array.isArray(body)) {
      try {
        body.map((x) => checkers.PostRestrictedView.check(x));
        expect(true).toBe(true);
      } catch (e) {
        console.error(e);
        fail("One or more of the posts didn't match the format.");
      }
    } else {
      fail("The return value must be an array");
    }
  })
  
  test("get post with invalid id", (done) => {
    app
      .get(`${path}/999999`)
      .expect(400, done)
  });
  
  describe("authenticated post tests", () => {
    let token: string;
    let alt_token: string;
    let admin_token: string;
    let root_categoryId: number;
    let tagId: number;
    let tag2Id: number;

    beforeAll(async () => {
      try {
        await userService.register(username, password)
        await userService.register(username2, password)
        const admin = await userService.register(username3, password)
        await userService.setAdmin(admin.id, true);
      } catch (e) { }
      token = await login(username, password);
      alt_token = await login(username2, password);
      admin_token = await login(username3, password);
      // create category to use for testing
      const res = await app.post(categoryPath)
        .set('Authorization', `Bearer ${admin_token}`)
        .send({ name: "My First Category" });
      const res2 = await app.post(categoryPath)
        .set('Authorization', `Bearer ${admin_token}`)
        .send({ name: "My Second Category", parentId: res.body.id });
      const res3 = await app.post(tagPath)
        .set('Authorization', `Bearer ${admin_token}`)
        .send({ name: tag1 });
      const res4 = await app.post(tagPath)
        .set('Authorization', `Bearer ${admin_token}`)
        .send({ name: tag2 });
      root_categoryId = res.body.id;
      tagId = res3.body.id;
      tag2Id = res4.body.id;
      samplePost.categoryId = res2.body.id;
    });

    afterAll(async () => {
      try {
        await userService.deleteByUsername(username);
        await userService.deleteByUsername(username2);
        await userService.deleteByUsername(username3);
        await categoryService.delete(root_categoryId);
        await tagService.deleteByName(tag1);
        await tagService.deleteByName(tag2);
      } catch (e) { }
    })

    test("creating post with valid credentials", (done) =>
      createPost(token, samplePost, done));
    
    test("failing to create post with missing credentials", (done) =>
      createPost(token, { name }, done, 400));

    test("creating post with a tag that exists", (done) =>
      createPost(token, { ...samplePost, tags: [tagId] }, (err, res) => {
        if (err) return done(err);
        if (res.body.tags[0] !== tagId) {
          return done("The tag that is attached is not the correct one")
        }
        done();
      }));

    test("failing to create post with a tag that does not exist", (done) =>
      createPost(token, { ...samplePost, tags: [ -1 ] }, done, 400));

    test("creating post and then getting it", (done) => {
      createPost(token, samplePost, (err, res) => {
        if (err) return done(err)
        const { id } = res.body;
        if (id) {
          getOnePost(token, id, (err, res) => {
            if (err) return done(err);
            checkers.PostView.check(res.body);
            if (res.body.myScore === undefined) {
              return done("The score is missing from the post");
            }
            done();
          })
        } else {
          fail("id from post was not returned")
        }
      })
    })

    test("creating post and then getting user id as admin", (done) => {
      createPost(admin_token, samplePost, (err, res) => {
        if (err) return done(err)
        const { id } = res.body;
        if (id) {
          getOnePost(admin_token, id, (err, res) => {
            if (err) return done(err);
            checkers.PostView.check(res.body);
            if (res.body.myScore === undefined) {
              return done("The score is missing from the post");
            }
            if (res.body.authorId === undefined) {
              return done("The user ID is missing from the post.");
            }
            done();
          })
        } else {
          fail("id from post was not returned")
        }
      })
    })

    const deletePost = (
      token: string, 
      id: number,
      callback?: request.CallbackHandler | undefined, 
      expected: number = 204
    ) => {
      app
        .delete(`${postPath}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(expected, callback);
    }

    test("creating post and then deleting it", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          deletePost(token, res.body.id, done);
        });
    });

    test("creating post and then failing to delete while not signed in", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          deletePost("", res.body.id, done, 401);
        });
    });

    test("creating post and then failing to delete it with another account", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          deletePost(alt_token, res.body.id, done, 401);
        });
    });

    test("creating post and then deleting it with an admin account", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          deletePost(admin_token, res.body.id, done);
        });
    });

    const name2 = "Goodbye, Martha";
    const content2 = "Adios, Rarity";
    const sampleEdit = {
      name: name2, content: content2,
    }

    const editPost = (
      token: string, 
      id: number,
      data: any,
      callback?: request.CallbackHandler | undefined, 
      expected: number = 200,
    ) => {
      app
        .put(`${postPath}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(data)
        .expect(expected, callback);
    }

    test("creating post and then editing it", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          editPost(token, res.body.id, sampleEdit, done);
        });
    });

    test("creating post with tags and then changing them", (done) => {
      createPost(token, { ...samplePost, tags: [tagId] }, (err, res) => {
          if (err) return done(err);
          editPost(token, res.body.id, {...sampleEdit, tags: [tag2Id]}, (err, res2) => {
            if (err) return done(err);
            if (res.body.tags[0] === res2.body.tags[0]) {
              return done("The tags weren't changed in any way");
            }
            done();
          });
        });
    });

    test("creating post and then failing to edit while not signed in", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          editPost("", res.body.id, sampleEdit, done, 401);
        });
    });

    test("creating post and then failing to edit it with another account", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          editPost(alt_token, res.body.id, sampleEdit, done, 401);
        });
    });

    test("creating post and then editing it with an admin account", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          editPost(admin_token, res.body.id, sampleEdit, done);
        });
    });

    test("creating post and then seeing if it is 'mine' on the same account", (done) => {
      createPost(token, samplePost, (err, res) => {
          if (err) return done(err);
          editPost(token, res.body.id, sampleEdit, done);
        });
    });

    test("creating post and then check if 'mine' is true on the same account", (done) => {
      createPost(token, samplePost, (err, res) => {
        if (err) return done(err)
        const { id } = res.body;
        if (id) {
          getOnePost(token, id, (err, res) => {
            if (err) return done(err);
            checkers.PostView.check(res.body);
            if (res.body.mine === false) {
              return done("mine is not set to true despite it being the user's post");
            }
            done();
          })
        } else {
          fail("id from post was not returned")
        }
      })
    })

    test("creating post and then check if 'mine' is false on a different account", (done) => {
      createPost(token, samplePost, (err, res) => {
        if (err) return done(err)
        const { id } = res.body;
        if (id) {
          getOnePost(alt_token, id, (err, res) => {
            if (err) return done(err);
            checkers.PostView.check(res.body);
            if (res.body.mine === true) {
              return done("mine is set to true despite it not being the user's post");
            }
            done();
          })
        } else {
          fail("id from post was not returned")
        }
      })
    });
  });
});

describe("voting related tests", () => {
  let token: string;
  let userId: number;
  let postId: number;
  let categoryId: number;

  beforeAll(async () => {
    try {
      const admin = await userService.register(username3, password)
      userId = admin.id;
      await userService.setAdmin(admin.id, true);
    } catch (e) { }
    token = await login(username3, password);
    // create post to use for testing votes on
    const res = await app.post(categoryPath)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "My First Category" });
    categoryId = res.body.id; 
    const post_data: PostProperties = {
      categoryId: res.body.id,
      name: "My Testing Post",
      content: "XD",
    };
    const res2 = await app.post(postPath)
      .set('Authorization', `Bearer ${token}`)
      .send(post_data);
    postId = res2.body.id; 
  })

  const createVote = postFactory(votePath, 200);

  afterEach((done) => {
    createVote(token, { postId, score: 0 }, done)
  })

  afterAll(async () => {
    try {
      await userService.deleteById(userId);
      await categoryService.delete(categoryId);
    } catch (e) { }
  })

  const checkScore = (
    score: number,
    done: jest.DoneCallback, 
  ) => {
    getOnePost(token, postId, (err, res) => {
      if (err) return done(err);
      if (res.body.score !== score) {
        return done("The score of the post is not the expected value back.");
      }
      done();
    })
  }

  test("fail to vote on a post while not signed in", (done) => {
    const vote: VoteProperties = {
      postId,
      score: 1,
    };
    createVote("", vote, () => {
      checkScore(0, done);
    })
  }, 401);

  test("upvote on a post while signed in", (done) => {
    const vote: VoteProperties = {
      postId,
      score: 1,
    };
    createVote(token, vote, (err, res) => {
      if (err) return done(err);
      if (res.body.myScore !== 1) {
        return done("The score sent is not the expected value back.");
      }
      checkScore(1, done);
    });
  });

  test("downvote a post while signed in", (done) => {
    const vote: VoteProperties = {
      postId,
      score: -1,
    };
    createVote(token, vote, (err, res) => {
      if (err) return done(err);
      if (res.body.myScore !== -1) {
        return done("The score sent is not the expected value back.");
      }
      checkScore(-1, done);
    });
  });

  test("fail voting with an invalid score", (done) => {
    const vote: VoteProperties = {
      postId,
      score: 4,
    };
    createVote(token, vote, (err, res) => {
      if (err) return done(err);
      checkScore(0, done);
    }, 400);
  });
})
