import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

export interface CreateAuditLogParams {
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      table_name: params.tableName,
      record_id: params.recordId,
      action: params.action,
      old_values: params.oldValues,
      new_values: params.newValues,
      user_id: params.userId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async findAll(
    tableName?: string,
    recordId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (tableName) {
      query.andWhere('audit_log.table_name = :tableName', { tableName });
    }

    if (recordId) {
      query.andWhere('audit_log.record_id = :recordId', { recordId });
    }

    return await query
      .orderBy('audit_log.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findByRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { table_name: tableName, record_id: recordId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AuditLog | null> {
    return await this.auditLogRepository.findOne({ where: { id } });
  }
}
