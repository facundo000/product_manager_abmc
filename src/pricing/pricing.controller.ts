import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interface/valid-roles';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  create(@Body() createPricingDto: CreatePricingDto, @Req() req) {
    return this.pricingService.create(createPricingDto, req.user.userId);
  }

  @Get('product/:id')
  @Auth(ValidRoles.ADMIN, ValidRoles.VIEWER, ValidRoles.EMPLOYEE)
  findCurrentByProductId(@Param('id') productId: string) {
    return this.pricingService.findCurrentByProductId(productId);
  }

  @Get('product/:id/history')
  @Auth(ValidRoles.ADMIN, ValidRoles.VIEWER, ValidRoles.EMPLOYEE)
  findHistoryByProductId(@Param('id') productId: string) {
    return this.pricingService.findHistoryByProductId(productId);
  }

  @Patch(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
  update(
    @Param('id') id: string,
    @Body() updatePricingDto: UpdatePricingDto,
    @Req() req,
  ) {
    return this.pricingService.update(id, updatePricingDto, req.user.userId);
  }

  @Delete(':id')
  @Auth(ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.pricingService.remove(id);
  }
}