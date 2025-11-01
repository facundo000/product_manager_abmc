import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interface/valid-roles';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create inventory record for a product' })
  @ApiResponse({ status: 201, description: 'Inventory created successfully' })
  @ApiResponse({ status: 400, description: 'Inventory already exists for product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async create(
    @Body() dto: CreateInventoryDto,
    @GetUser() user: User,
  ) {
    // user currently unused in service for create; reserved for future auditing with JWT user
    return await this.inventoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory records' })
  @ApiResponse({ status: 200, description: 'Returns list of inventory' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async findAll() {
    return await this.inventoryService.findAll();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get inventory with low stock (quantity <= min_stock)' })
  @ApiResponse({ status: 200, description: 'Returns list of low stock inventory' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async lowStock() {
    return await this.inventoryService.getLowStock();
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory by product ID' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Inventory found' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async findByProduct(@Param('productId') productId: string) {
    return await this.inventoryService.findByProduct(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory by ID' })
  @ApiParam({ name: 'id', description: 'Inventory UUID' })
  @ApiResponse({ status: 200, description: 'Inventory found' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async findOne(@Param('id') id: string) {
    return await this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory settings (no direct quantity changes)' })
  @ApiParam({ name: 'id', description: 'Inventory UUID' })
  @ApiResponse({ status: 200, description: 'Inventory updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @GetUser() user: User,
  ) {
    return await this.inventoryService.update(id, dto);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity by creating a movement' })
  @ApiParam({ name: 'id', description: 'Inventory UUID' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  async adjust(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
    @GetUser() user: User,
  ) {
    return await this.inventoryService.adjust(id, dto, user?.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get movement history for an inventory record' })
  @ApiParam({ name: 'id', description: 'Inventory UUID' })
  @ApiResponse({ status: 200, description: 'Returns movement history' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async history(@Param('id') id: string) {
    return await this.inventoryService.getHistory(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete inventory record' })
  @ApiParam({ name: 'id', description: 'Inventory UUID' })
  @ApiResponse({ status: 204, description: 'Inventory deleted successfully' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    await this.inventoryService.remove(id);
  }
}
