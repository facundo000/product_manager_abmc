import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interface/valid-roles';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Brands')
@Controller('brands')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  create(@Body() createBrandDto: CreateBrandDto, @GetUser() user: User) {
    return this.brandService.create(createBrandDto, user.id);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all brands' })
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a brand by id' })
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand' })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto, @GetUser() user: User) {
    return this.brandService.update(id, updateBrandDto, user.id);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a brand' })
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
