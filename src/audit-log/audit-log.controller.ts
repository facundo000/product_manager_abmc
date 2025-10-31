import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';

@ApiTags('audit-log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with optional filters' })
  @ApiQuery({ name: 'tableName', required: false, description: 'Filter by table name' })
  @ApiQuery({ name: 'recordId', required: false, type: Number, description: 'Filter by record ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit results (default: 100)' })
  @ApiResponse({ status: 200, description: 'Returns list of audit logs' })
  async findAll(
    @Query('tableName') tableName?: string,
    @Query('recordId') recordId?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.auditLogService.findAll(
      tableName,
      recordId ? recordId: undefined,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('record/:tableName/:recordId')
  @ApiOperation({ summary: 'Get audit history for a specific record' })
  @ApiResponse({ status: 200, description: 'Returns audit history' })
  async findByRecord(
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string,
  ) {
    return await this.auditLogService.findByRecord(tableName, recordId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log found' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id') id: string) {
    return await this.auditLogService.findOne(parseInt(id));
  }
}
