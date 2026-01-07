import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';

@ApiTags('products')
@Controller('products')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product with SKU or barcode already exists' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User
  ) {
    return await this.productService.create(createProductDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by product status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, SKU, or barcode' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive products' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Order by field (name, created_at, etc.)' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Order direction' })
  @ApiResponse({ status: 200, description: 'Returns list of products' })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('categoryId') categoryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: 'ASC' | 'DESC',
  ) {
    return await this.productService.findAll({
      status,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      includeInactive: includeInactive === 'true',
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      categoryId,
      startDate,
      endDate,
      orderBy,
      orderDirection,
    });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Returns list of products with low stock' })
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async getLowStock() {
    return await this.productService.getLowStock();
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Find product by barcode (for barcode scanning)' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findByBarcode(@Param('barcode') barcode: string) {
    return await this.productService.findByBarcode(barcode);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Find product by SKU' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySku(@Param('sku') sku: string) {
    return await this.productService.findBySku(sku);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }

  @Get(':id/audit-history')
  @ApiOperation({ summary: 'Get audit history for a product' })
  @ApiResponse({ status: 200, description: 'Returns audit history' })
  async getAuditHistory(@Param('id') id: string) {
    return await this.productService.getAuditHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product with SKU or barcode already exists' })
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User
  ) {
    return await this.productService.update(id, updateProductDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a product (set status to inactive)' })
  @ApiResponse({ status: 200, description: 'Product soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete product with stock' })
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return await this.productService.remove(id, user.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft deleted product' })
  @ApiResponse({ status: 200, description: 'Product restored successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Product is not inactive' })
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async restore(@Param('id') id: string, @GetUser() user: User) {
    return await this.productService.restore(id, user.id);
  }
}
