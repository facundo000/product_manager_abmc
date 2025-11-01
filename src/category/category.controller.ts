import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Param, 
  Delete, 
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  @ApiResponse({ status: 409, description: 'Category with same name already exists at this level' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: User,
  ) {
    return await this.categoryService.create(createCategoryDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with optional filters' })
  @ApiQuery({ name: 'parent_id', required: false, description: 'Filter by parent category ID (use "null" for root categories)' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiResponse({ status: 200, description: 'Returns list of categories' })
  async findAll(
    @Query('parent_id') parent_id?: string,
    @Query('is_active') is_active?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    
    if (parent_id !== undefined) {
      filters.parent_id = parent_id;
    }
    
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }
    
    if (search) {
      filters.search = search;
    }

    return await this.categoryService.findAll(filters);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get complete category tree (hierarchical structure)' })
  @ApiResponse({ status: 200, description: 'Returns hierarchical category tree' })
  async getTree() {
    return await this.categoryService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return await this.categoryService.findOne(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get all children of a category' })
  @ApiParam({ name: 'id', description: 'Parent category UUID' })
  @ApiResponse({ status: 200, description: 'Returns list of child categories' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  async findChildren(@Param('id') id: string) {
    return await this.categoryService.findChildren(id);
  }

  @Get(':id/audit-history')
  @ApiOperation({ summary: 'Get audit history for a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Returns audit history' })
  @ApiBearerAuth()
  async getAuditHistory(@Param('id') id: string) {
    return await this.categoryService.getAuditHistory(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or circular reference' })
  @ApiResponse({ status: 404, description: 'Category or parent category not found' })
  @ApiResponse({ status: 409, description: 'Category with same name already exists at this level' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: User,
  ) {
    return await this.categoryService.update(id, updateCategoryDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (hard delete)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete category with subcategories' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    await this.categoryService.remove(id, user.id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Soft delete a category (set is_active to false)' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  async softDelete(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return await this.categoryService.softDelete(id, user.id);
  }
}
