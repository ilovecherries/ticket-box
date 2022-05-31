import { BadRequestException, Injectable } from '@nestjs/common';
import { Post, PostTagRelationship, User, Vote } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';
import { PrismaService } from './../prisma/prisma.service';

export interface PostDto {
  id: number;
  content: string;
  name: string;
  categoryId: number;
  score: number;
  authorId?: number;
  myScore?: number;
  mine?: boolean;
  tags?: Array<number>;
}

export interface PostRestrictedDto {
  id: number;
  content: string;
  categoryId: number;
  name: string;
  score: number;
  myScore?: number;
  mine?: boolean;
  tags?: Array<number>;
}

export class PostProperties {
  @IsNotEmpty()
  content: string;
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  categoryId: number;
  tags?: number[];
}

export type PostData = Post & {
  votes?: Vote[];
  PostTagRelationship?: PostTagRelationship[];
};

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * This DTO transformation function is for when the user is an admin user
   * and is eligible to get information about who the author of the post.
   * is.
   * @param post The post to be converted into a DTO
   * @param receiverId The user id of the person who is receiving the post
   * @returns Privileged post DTO
   */
  private toPrivilegedDto(post: PostData, receiverId?: number): PostDto {
    const dto: PostDto = {
      id: post.id,
      content: post.content,
      name: post.name,
      categoryId: post.categoryId,
      authorId: post.authorId || undefined,
      score: post.votes?.reduce((a, b) => a + b.score, 0) || 0,
      tags: post.PostTagRelationship?.map((x) => x.tagId),
    };
    if (receiverId) {
      dto.myScore =
        post.votes?.find((x) => x.voterId === receiverId)?.score || 0;
      dto.mine = dto.authorId === receiverId;
    }
    return dto;
  }

  /**
   * This DTO transformation function is for when the user is not an admin user
   * and is not eligible to get information about who the author of the post.
   * is.
   * @param post The post to be converted into a DTO
   * @param receiverId The user id of the person who is receiving the post
   * @returns Restricted post DTO
   */
  toRestrictedDto(post: PostData, receiverId?: number): PostRestrictedDto {
    const dto = this.toPrivilegedDto(post, receiverId);
    const restrictedDto: PostRestrictedDto = {
      id: dto.id,
      content: dto.content,
      name: dto.name,
      categoryId: dto.categoryId,
      score: dto.score,
      tags: dto.tags,
    };
    if (dto.myScore !== undefined) {
      restrictedDto.myScore = dto.myScore;
    }
    if (dto.mine !== undefined) {
      restrictedDto.mine = dto.mine;
    }
    return restrictedDto;
  }

  /**
   * This DTO transformation function is transforms the post and removes
   * information about the post depending on the permissions that the user
   * has.
   * @param post The post to be converted into a DTO
   * @param user The user object of the person who is receiving the post
   * @returns Transformed post DTO
   */
  toDto(post: PostData, user?: User): PostDto | PostRestrictedDto {
    if (user) {
      if (user.admin) {
        return this.toPrivilegedDto(post, user.id);
      } else {
        return this.toRestrictedDto(post, user.id);
      }
    } else {
      return this.toRestrictedDto(post);
    }
  }

  async getAll(): Promise<PostData[]> {
    return this.prisma.post.findMany({
      include: { votes: true, PostTagRelationship: true },
    });
  }

  async getOne(id: number): Promise<PostData | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: { votes: true, PostTagRelationship: true },
    });
  }

  async transformProperties(
    props: Partial<PostProperties>,
    user?: User,
    id?: number,
  ): Promise<any> {
    const { tags, categoryId, ...data } = props as any;
    if (tags) {
      if (id) {
        await this.prisma.postTagRelationship.deleteMany({
          where: { postId: id },
        });
      }
      const t = await this.prisma.tag.findMany({
        where: { id: { in: tags } },
      });
      if (tags.length !== t.length) {
        throw new BadRequestException(
          'One or more of the tags attached to the post do not exist.',
        );
      }
    }
    if (categoryId) {
      data.category = { connect: { id: props.categoryId } };
    }
    if (user) {
      data.author = { connect: { id: user.id } };
    }
    return data;
  }

  async attachTags(postId: number, tags: number[]) {
    for (const x of tags) {
      await this.prisma.postTagRelationship.create({
        data: {
          post: { connect: { id: postId } },
          tag: { connect: { id: x } },
        },
      });
    }
  }

  async create(props: PostProperties, user: User): Promise<PostData> {
    const data = await this.transformProperties(props, user);
    const post = await this.prisma.post.create({
      data,
    });
    await this.attachTags(post.id, props.tags || []);
    return this.getOne(post.id);
  }

  async edit(
    id: number,
    props: Partial<PostProperties>,
    user: User,
  ): Promise<PostData> {
    const data = await this.transformProperties(props, user, id);
    const post = await this.prisma.post.update({
      where: { id },
      data,
    });
    if (props.tags) {
      await this.attachTags(post.id, props.tags || []);
      return this.getOne(post.id);
    } else {
      return post;
    }
  }

  async delete(id: number) {
    await this.prisma.post.delete({
      where: { id },
    });
  }
}
