import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './../users/users.service';
import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import {
  CategoriesService,
  CategoryDto,
  CategoryProperties,
} from './categories.service';
import { AdminGuard } from './../auth/admin.guard';

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly usersService: UsersService,
  ) { }

  @Get()
  async getAll(): Promise<CategoryDto[]> {
    const categories = await this.categoriesService.getAll();
    return categories.map(this.categoriesService.toDto);
  }

  @Get(':id')
  getOne(@Param('id', new ParseIntPipe()) id: number): Promise<CategoryDto> {
    const category = this.categoriesService.getOne(id);
    if (category) return category;
    else throw new NotFoundException();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() body: CategoryProperties): Promise<CategoryDto> {
    return this.categoriesService.toDto(
      await this.categoriesService.create(body),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  @UsePipes(ValidationPipe)
  async edit(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: Partial<CategoryProperties>,
  ): Promise<CategoryDto> {
    return this.categoriesService.toDto(
      await this.categoriesService.edit(id, body),
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', new ParseIntPipe()) id: number) {
    await this.categoriesService.delete(id);
  }
}
