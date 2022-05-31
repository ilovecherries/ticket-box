import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import { AnonymousAuthGuard } from './../auth/anonymous-auth.guard';
import { UsersService } from './../users/users.service';
import {
  PostDto,
  PostProperties,
  PostRestrictedDto,
  PostsService,
} from './posts.service';

@Controller({
  path: 'posts',
  version: '1',
})
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AnonymousAuthGuard)
  @Get()
  async getAll(@Req() req): Promise<(PostRestrictedDto | PostDto)[]> {
    const posts = await this.postsService.getAll();
    if (req.user) {
      const user = await this.usersService.getById(req.user.userId);
      return posts.map((p) => this.postsService.toDto(p, user));
    } else {
      return posts.map((p) => this.postsService.toDto(p));
    }
  }

  @UseGuards(AnonymousAuthGuard)
  @Get(':id')
  async getOne(
    @Req() req,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PostRestrictedDto | PostDto> {
    const post = await this.postsService.getOne(id);
    if (post) {
      if (req.user) {
        const user = await this.usersService.getById(req.user.userId);
        return this.postsService.toDto(post, user);
      } else {
        return this.postsService.toDto(post);
      }
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async create(
    @Req() req,
    @Body() body: PostProperties,
  ): Promise<PostRestrictedDto | PostDto> {
    const user = await this.usersService.getById(req.user.userId);
    return this.postsService.toDto(
      await this.postsService.create(body, user),
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UsePipes(ValidationPipe)
  async edit(
    @Req() req,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: Partial<PostProperties>,
  ): Promise<PostRestrictedDto | PostDto> {
    const post = await this.postsService.getOne(id);
    if (post) {
      const user = await this.usersService.getById(req.user.userId);
      if (user.admin || user.id === post.authorId) {
        return this.postsService.toDto(
          await this.postsService.edit(id, body, user),
          user,
        );
      } else {
        throw new ForbiddenException();
      }
    } else {
      throw new NotFoundException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete(':id')
  async delete(@Req() req, @Param('id', new ParseIntPipe()) id: number) {
    const post = await this.postsService.getOne(id);
    if (post) {
      const user = await this.usersService.getById(req.user.userId);
      if (user.admin || user.id === post.authorId) {
        return await this.postsService.delete(id);
      } else {
        throw new ForbiddenException();
      }
    } else {
      throw new NotFoundException();
    }
  }
}
