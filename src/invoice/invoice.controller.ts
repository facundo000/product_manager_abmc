import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interface/valid-roles';
import { User } from '../user/entities/user.entity';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

@ApiTags('invoices')
@ApiBearerAuth()
@Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: Invoice,
  })
  async createInvoice(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @GetUser() user: User,
  ): Promise<Invoice> {
    return await this.invoiceService.createInvoice(createInvoiceDto, user);
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
    type: Invoice,
  })
  async getInvoice(@Param('id') invoiceId: string): Promise<Invoice> {
    return await this.invoiceService.getInvoiceById(invoiceId);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
  })
  async getAllInvoices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: InvoiceStatus,
  ): Promise<{
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.invoiceService.getAllInvoices(page, limit, status);
  }
}
