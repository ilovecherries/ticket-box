import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserDto, UsersService } from './../src/users/users.service';
import { PrismaService } from './../src/prisma/prisma.service';
import { AuthService, UserCredentials } from './../src/auth/auth.service';
import {
  CategoriesService,
  CategoryDto,
  CategoryProperties,
} from './../src/categories/categories.service';
import type { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './../src/auth/constants';
import {
  PostDto,
  PostProperties,
  PostRestrictedDto,
  PostsService,
} from './../src/posts/posts.service';
import { TagProperties, TagsService } from './../src/tags/tags.service';

const SAMPLE_USERNAME = 'Quandale';
const SAMPLE_USERNAME_2 = 'Dimmadome';
const SAMPLE_USERNAME_3 = 'Kirby';
const SAMPLE_PASSWORD = 'Dingle';

const prismaService = new PrismaService();
const usersService = new UsersService(prismaService);

const categoriesService = new CategoriesService(prismaService);
const tagsService = new TagsService(prismaService);
const postsService = new PostsService(prismaService);
const jwtService = new JwtService({
  secret: jwtConstants.secret,
  signOptions: { expiresIn: '60s' },
});
const authService = new AuthService(usersService, jwtService);

interface IItem {
  id: number;
}

interface IItemService<T extends IItem> {
  delete(id: number): Promise<T>;
  create(props): Promise<T>;
}

const createItem = async <T extends IItem, U>(
  service: IItemService<T>,
  data: U,
  id?: number,
): Promise<T> => {
  if (id)
    try {
      await service.delete(id);
    } catch (e) { }
  if (id)
    try {
      await service.delete(id);
    } catch (e) { }
  return await service.create(data);
};

const deleteUser = async (username = SAMPLE_USERNAME) => {
  try {
    await usersService.deleteByUsername(username);
  } catch (e) { }
};

const createUser = async (username = SAMPLE_USERNAME): Promise<User> => {
  await deleteUser(username);
  return await usersService.create(username, SAMPLE_PASSWORD);
};

const loginUser = (user: User): { access_token: string } => {
  return authService.login(user);
};

type UserSample = {
  admin: User;
  normal: User;
  alt: User;
};

const createUsers = async (): Promise<UserSample> => {
  const user = await createUser();
  const user2 = await createUser(SAMPLE_USERNAME_2);
  const user3 = await createUser(SAMPLE_USERNAME_3);
  await usersService.setAdmin(user.username, true);
  return {
    admin: user,
    normal: user2,
    alt: user3,
  };
};

const deleteUsers = async () => {
  await deleteUser();
  await deleteUser(SAMPLE_USERNAME_2);
  await deleteUser(SAMPLE_USERNAME_3);
};

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning();
    await app.init();
  });

  type GetFactoryFunction = (token?: string, expect?: number) => request.Test;
  type GetOneFactoryFunction = (
    id: number,
    token?: string,
    expect?: number,
  ) => request.Test;
  type PostFactoryFunction<T extends object | string> = (
    data: T | any,
    token?: string,
    expect?: number,
  ) => request.Test;
  type PutFactoryFunction<T extends object | string> = (
    id: number,
    data: Partial<T> | any,
    token?: string,
    expect?: number,
  ) => request.Test;
  type DeleteFactoryFunction = (
    id: number,
    token?: string,
    expect?: number,
  ) => request.Test;

  const getOneFactory = (path: string): GetOneFactoryFunction => {
    return (id: number, token = '', expect = 200) => {
      return request(app.getHttpServer())
        .get(`${path}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(expect);
    };
  };

  const getFactory = (path: string): GetFactoryFunction => {
    return (token = '', expect = 200) => {
      return request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${token}`)
        .expect(expect);
    };
  };

  const postFactory = <T extends object | string>(
    path: string,
  ): PostFactoryFunction<T> => {
    return (data: T | any, token = '', expect = 201) => {
      return request(app.getHttpServer())
        .post(path)
        .send(data)
        .set('Authorization', `Bearer ${token}`)
        .expect(expect);
    };
  };

  const putFactory = <T extends object | string>(
    path: string,
  ): PutFactoryFunction<T> => {
    return (id: number, data: Partial<T> | any, token = '', expect = 200) => {
      return request(app.getHttpServer())
        .put(`${path}/${id}`)
        .send(data)
        .set('Authorization', `Bearer ${token}`)
        .expect(expect);
    };
  };

  const deleteFactory = (path: string): DeleteFactoryFunction => {
    return (id: number, token = '', expect = 204) => {
      return request(app.getHttpServer())
        .delete(`${path}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(expect);
    };
  };

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/v2/auth (User Authentication)', () => {
    const PATH = '/v2/auth';

    afterEach(deleteUser);
    beforeEach(deleteUser);

    const SAMPLE_CREDENTIALS: UserCredentials = {
      username: SAMPLE_USERNAME,
      password: SAMPLE_PASSWORD,
    };

    const registerUser = () => {
      return request(app.getHttpServer())
        .post(`${PATH}/register`)
        .send(SAMPLE_CREDENTIALS)
        .expect(201)
        .expect((x: UserDto) => x.username === SAMPLE_USERNAME);
    };

    const loginUser = () => {
      return request(app.getHttpServer())
        .post(`${PATH}/login`)
        .send(SAMPLE_CREDENTIALS)
        .expect(201);
    };

    it('Fail to get self user data while logged out', () => {
      return request(app.getHttpServer()).get(`${PATH}/me`).expect(401);
    });

    it('Registering user', registerUser);

    it('Logging in user', () => registerUser().then(loginUser));

    it('Get self user data while logged in', () =>
      registerUser().then(() =>
        loginUser().then((res) => {
          return request(app.getHttpServer())
            .get(`${PATH}/me`)
            .set('Authorization', `Bearer ${res.body.access_token}`)
            .expect(200)
            .expect((x: UserDto) => x.username === SAMPLE_USERNAME);
        }),
      ));
  });

  describe('/v1/categories (Categories)', () => {
    const PATH = '/v1/categories';

    const SAMPLE_NAME = 'My Category';
    const SAMPLE_NAME_2 = 'My Category';
    const SAMPLE_CATEGORY: CategoryProperties = { name: SAMPLE_NAME };
    const SAMPLE_CATEGORY_2: CategoryProperties = { name: SAMPLE_NAME_2 };

    let token = '',
      admin_token = '';

    beforeAll(async () => {
      const { normal, admin } = await createUsers();
      token = loginUser(normal).access_token;
      admin_token = loginUser(admin).access_token;
    });

    afterAll(deleteUsers);

    const createCategory = postFactory<CategoryProperties>(PATH);

    it('Fail to create a category while not signed in', () => {
      return createCategory(SAMPLE_CATEGORY, '', 401);
    });

    it('Fail to create a category while signed in as a normal user', () => {
      return createCategory(SAMPLE_CATEGORY, token, 403);
    });

    it('Create a category while signed in as an admin', () => {
      return createCategory(SAMPLE_CATEGORY, admin_token);
    });

    it('Fail to create a category with missing credentials', () => {
      return createCategory({}, admin_token, 400);
    });

    describe('Editing categories', () => {
      let id = 0;

      const editCategory = putFactory<CategoryProperties>(PATH);

      beforeEach(async () => {
        const category = await createItem(
          categoriesService,
          SAMPLE_CATEGORY,
          id,
        );
        id = category.id;
      });

      afterEach(async () => {
        try {
          await categoriesService.delete(id);
        } catch (e) { }
      });

      it('Fail to edit a category while not signed in', () => {
        return editCategory(id, SAMPLE_CATEGORY_2, '', 401);
      });

      it('Fail to edit a category while signed in as a normal user', () => {
        return editCategory(id, SAMPLE_CATEGORY_2, token, 403);
      });

      it('Edit a category while signed in as an admin', () => {
        return editCategory(id, SAMPLE_CATEGORY_2, admin_token).expect(
          (c: CategoryDto) => c.name === SAMPLE_CATEGORY_2.name,
        );
      });
    });

    describe('Deleting categories', () => {
      let id = 0;

      const deleteCategory = deleteFactory(PATH);

      beforeEach(async () => {
        try {
          await categoriesService.delete(id);
        } catch (e) { }
        const category = await categoriesService.create(SAMPLE_CATEGORY);
        id = category.id;
      });

      afterEach(async () => {
        try {
          await categoriesService.delete(id);
        } catch (e) { }
      });

      it('Fail to delete a category while not signed in', () => {
        return deleteCategory(id, '', 401);
      });

      it('Fail to delete a category while signed in as a normal user', () => {
        return deleteCategory(id, token, 403);
      });

      it('Delete a category while signed in as an admin', () => {
        return deleteCategory(id, admin_token);
      });
    });
  });

  describe('/v1/tags (Tags)', () => {
    const PATH = '/v1/tags';

    const SAMPLE_NAME = 'My Tag';
    const SAMPLE_NAME_2 = 'My Edited Tag';
    const SAMPLE_TAG: TagProperties = { name: SAMPLE_NAME };
    const SAMPLE_TAG_2: TagProperties = { name: SAMPLE_NAME_2 };

    let token = '',
      admin_token = '';

    beforeAll(async () => {
      const { normal, admin } = await createUsers();
      token = loginUser(normal).access_token;
      admin_token = loginUser(admin).access_token;
    });

    afterAll(deleteUsers);

    const createTag = postFactory<TagProperties>(PATH);

    it('Fail to create a tag while not signed in', () => {
      return createTag(SAMPLE_TAG, '', 401);
    });

    it('Fail to create a tag while signed in as a normal user', () => {
      return createTag(SAMPLE_TAG, token, 403);
    });

    it('Create a tag while signed in as an admin', () => {
      return createTag(SAMPLE_TAG, admin_token);
    });

    it('Fail to create a tag with missing credentials', () => {
      return createTag({}, admin_token, 400);
    });

    describe('Editing tags', () => {
      let id = 0;

      const editTag = putFactory<TagProperties>(PATH);

      beforeEach(async () => {
        const tag = await createItem(tagsService, SAMPLE_TAG, id);
        id = tag.id;
      });

      afterEach(async () => {
        try {
          await tagsService.delete(id);
        } catch (e) { }
      });

      it('Fail to edit a category while not signed in', () => {
        return editTag(id, SAMPLE_TAG_2, '', 401);
      });

      it('Fail to edit a category while signed in as a normal user', () => {
        return editTag(id, SAMPLE_TAG_2, token, 403);
      });

      it('Edit a category while signed in as an admin', () => {
        return editTag(id, SAMPLE_TAG_2, admin_token).expect(
          (c: CategoryDto) => c.name === SAMPLE_TAG_2.name,
        );
      });
    });

    describe('Deleting tags', () => {
      let id = 0;

      const deleteTag = deleteFactory(PATH);

      beforeEach(async () => {
        try {
          await tagsService.delete(id);
        } catch (e) { }
        const tag = await tagsService.create(SAMPLE_TAG);
        id = tag.id;
      });

      afterEach(async () => {
        try {
          await tagsService.delete(id);
        } catch (e) { }
      });

      it('Fail to delete a tag while not signed in', () => {
        return deleteTag(id, '', 401);
      });

      it('Fail to delete a tag while signed in as a normal user', () => {
        return deleteTag(id, token, 403);
      });

      it('Delete a tag while signed in as an admin', () => {
        return deleteTag(id, admin_token);
      });
    });
  });

  describe('/v1/posts (Posts)', () => {
    const PATH = '/v1/posts';

    let categoryId = -1;
    const SAMPLE_NAME = 'My Post';
    const SAMPLE_NAME_2 = 'My Post But Edited';
    const SAMPLE_POST: Partial<PostProperties> = {
      name: SAMPLE_NAME,
      content: 'My Post Content',
    };
    const SAMPLE_POST_2: Partial<PostProperties> = { name: SAMPLE_NAME_2 };

    let token = '',
      alt_token = '',
      admin_token = '';
    let normal: User, alt: User, admin: User;

    beforeAll(async () => {
      const category = await categoriesService.create({
        name: 'My Root Category',
      });
      categoryId = category.id;
      const users = await createUsers();
      normal = users.normal;
      alt = users.alt;
      admin = users.admin;
      token = loginUser(normal).access_token;
      alt_token = loginUser(alt).access_token;
      admin_token = loginUser(admin).access_token;
    });

    afterAll(async () => {
      await categoriesService.delete(categoryId);
      await deleteUsers();
    });

    const POST_DATA = (): PostProperties => ({
      name: SAMPLE_POST.name,
      content: SAMPLE_POST.content,
      categoryId,
    });

    describe('Creating posts', () => {
      const createPost = postFactory<PostProperties>(PATH);

      it('Fail to create a post while not signed in', () => {
        return createPost(POST_DATA(), '', 401);
      });

      it('Create a post while signed in as a normal user', () => {
        return createPost(POST_DATA(), token);
      });

      it('Create a post while signed in as an admin', () => {
        return createPost(POST_DATA(), admin_token);
      });

      it('Fail to create a post with missing credentials', () => {
        return createPost({}, token, 400);
      });
    });

    describe('Viewing posts', () => {
      let id = 0;

      const getOnePost = getOneFactory(PATH);

      beforeEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
        const post = await postsService.create(POST_DATA(), normal);
        id = post.id;
      });

      afterEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
      });

      it('Check if "mine" and "myScore" properties are missing when not signed in', () => {
        return getOnePost(id).expect(
          (x: PostRestrictedDto) =>
            x.mine === undefined && x.myScore === undefined,
        );
      });

      it('Check if "myScore" property is present when signed in and "mine" is false when not author', () => {
        return getOnePost(id, alt_token).expect(
          (x: PostRestrictedDto) => x.mine === false && x.myScore !== undefined,
        );
      });

      it('Check if "myScore" property is present when signed in and "mine" is true when author', () => {
        return getOnePost(id, token).expect(
          (x: PostRestrictedDto) => x.mine === true && x.myScore !== undefined,
        );
      });

      it('Check if "authorId" property is not present when signed in as normal user', () => {
        return getOnePost(id, token).expect(
          (x: PostDto) => x.authorId === undefined,
        );
      });

      it('Check if "authorId" property is present when signed in as admin user', () => {
        return getOnePost(id, admin_token).expect(
          (x: PostDto) => x.authorId === undefined,
        );
      });
    });

    describe('Editing posts', () => {
      let id = 0;

      const editPost = putFactory<PostProperties>(PATH);

      beforeEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
        const post = await postsService.create(POST_DATA(), normal);
        id = post.id;
      });

      afterEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
      });

      it('Fail to edit a post while not signed in', () => {
        return editPost(id, SAMPLE_POST_2, '', 401);
      });

      it('Fail to edit a post while signed in as an alt user', () => {
        return editPost(id, SAMPLE_POST_2, alt_token, 403);
      });

      it('Edit a post while signed in as the post author', () => {
        return editPost(id, SAMPLE_POST_2, token).expect(
          (p: PostRestrictedDto) => p.name === SAMPLE_POST_2.name,
        );
      });

      it('Edit a post while signed in as an admin', () => {
        return editPost(id, SAMPLE_POST_2, admin_token).expect(
          (p: PostRestrictedDto) => p.name === SAMPLE_POST_2.name,
        );
      });
    });

    describe('Deleting posts', () => {
      let id = 0;

      const deletePost = deleteFactory(PATH);

      beforeEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
        const post = await postsService.create(POST_DATA(), normal);
        id = post.id;
      });

      afterEach(async () => {
        try {
          await postsService.delete(id);
        } catch (e) { }
      });

      it('Fail to delete a post while not signed in', () => {
        return deletePost(id, '', 401);
      });

      it('Fail to delete a post while signed in as an alt user', () => {
        return deletePost(id, alt_token, 403);
      });

      it('Delete a post while signed in as the post author', () => {
        return deletePost(id, token);
      });

      it('Delete a post while signed in as an admin', () => {
        return deletePost(id, admin_token);
      });
    });
  });
});
