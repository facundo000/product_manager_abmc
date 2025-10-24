import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuditAction } from '../../audit-log/entities/audit-log.entity';

/**
 * Audit Interceptor for automatic logging of HTTP requests
 * This interceptor captures request/response data and creates audit logs
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    
    // Extract user ID from request (you may need to adjust this based on your auth implementation)
    const userId = body?.created_by || body?.updated_by || headers['x-user-id'];

    // Determine action based on HTTP method
    let action: AuditAction;
    switch (method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      case 'GET':
        action = AuditAction.READ;
        break;
      default:
        action = AuditAction.READ;
    }

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          const responseTime = Date.now() - now;
          
          // Only log non-GET requests or specific GET requests
          if (method !== 'GET' || url.includes('/audit-history')) {
            try {
              // Extract table name and record ID from URL
              const urlParts = url.split('/');
              const tableName = this.extractTableName(urlParts);
              const recordId = this.extractRecordId(urlParts, data);

              if (tableName && recordId) {
                await this.auditLogService.createAuditLog({
                  tableName,
                  recordId,
                  action,
                  newValues: method === 'POST' ? data : body,
                  userId,
                  ipAddress: ip,
                  userAgent,
                });
              }
            } catch (error) {
              // Log error but don't fail the request
              console.error('Audit logging error:', error);
            }
          }
        },
        error: (error) => {
          // Optionally log failed requests
          console.error('Request failed:', error.message);
        },
      }),
    );
  }

  private extractTableName(urlParts: string[]): string | null {
    // Extract table name from URL (e.g., /api/v1/products -> products)
    const resourceIndex = urlParts.findIndex(part => 
      ['products', 'categories', 'inventory', 'pricing', 'users'].includes(part)
    );
    return resourceIndex !== -1 ? urlParts[resourceIndex] : null;
  }

  private extractRecordId(urlParts: string[], data: any): number | null {
    // Try to extract ID from URL
    const idFromUrl = urlParts[urlParts.length - 1];
    if (idFromUrl && !isNaN(parseInt(idFromUrl))) {
      return parseInt(idFromUrl);
    }

    // Try to extract ID from response data
    if (data?.id) {
      return parseInt(data.id);
    }

    return null;
  }
}
