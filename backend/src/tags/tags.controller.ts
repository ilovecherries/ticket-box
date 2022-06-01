import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AdminGuard } from './../auth/admin.guard';
import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import { TagDto, TagProperties, TagsService } from './tags.service';

@Controller({
  path: 'tags',
  version: '1',
})
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  @Get()
  async getAll(): Promise<TagDto[]> {
    const tags = await this.tagsService.getAll();
    return tags.map(this.tagsService.toDto);
  }

  @Get(':id')
  getOne(@Param('id', new ParseIntPipe()) id: number): Promise<TagDto> {
    const tags = this.tagsService.getOne(id);
    if (tags) return tags;
    else throw new NotFoundException();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() body: TagProperties): Promise<TagDto> {
    return this.tagsService.toDto(await this.tagsService.create(body));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @UsePipes(ValidationPipe)
  async edit(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: Partial<TagProperties>,
  ): Promise<TagDto> {
    return this.tagsService.toDto(await this.tagsService.edit(id, body));
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', new ParseIntPipe()) id: number) {
    await this.tagsService.delete(id);
  }
}
