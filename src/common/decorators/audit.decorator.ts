import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  tableName: string;
  skipAudit?: boolean;
}

/**
 * Decorator to mark endpoints for audit logging
 * @param tableName - The name of the table being audited
 * @param skipAudit - Optional flag to skip audit logging for this endpoint
 */
export const Audit = (tableName: string, skipAudit = false) =>
  SetMetadata(AUDIT_KEY, { tableName, skipAudit } as AuditMetadata);
