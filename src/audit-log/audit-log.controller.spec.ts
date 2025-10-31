import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditAction } from './entities/audit-log.entity';

describe('AuditLogController', () => {
  let controller: AuditLogController;
  let service: AuditLogService;

  const mockAuditLog = {
    id: 1,
    table_name: 'products',
    record_id: '123e4567-e89b-12d3-a456-426614174000',
    action: AuditAction.CREATE,
    old_values: null,
    new_values: { name: 'Test Product', sku: 'TEST-001' },
    user_id: '987e6543-e21b-98d7-a654-123456789000',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    created_at: new Date('2024-01-01'),
  };

  const mockAuditLogService = {
    findAll: jest.fn(),
    findByRecord: jest.fn(),
    findOne: jest.fn(),
    createAuditLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    service = module.get<AuditLogService>(AuditLogService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all audit logs without filters', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined, 100);
      expect(result).toEqual(auditLogs);
    });

    it('should filter by table name', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      const result = await controller.findAll('products');

      expect(service.findAll).toHaveBeenCalledWith('products', undefined, 100);
      expect(result).toEqual(auditLogs);
    });

    it('should filter by record ID', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      const result = await controller.findAll(undefined, '123e4567-e89b-12d3-a456-426614174000');

      expect(service.findAll).toHaveBeenCalledWith(undefined, '123e4567-e89b-12d3-a456-426614174000', 100);
      expect(result).toEqual(auditLogs);
    });

    it('should apply custom limit', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      const result = await controller.findAll(undefined, undefined, '50');

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined, 50);
      expect(result).toEqual(auditLogs);
    });

    it('should filter by table name, record ID and custom limit', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      const result = await controller.findAll('products', '123e4567-e89b-12d3-a456-426614174000', '25');

      expect(service.findAll).toHaveBeenCalledWith('products', '123e4567-e89b-12d3-a456-426614174000', 25);
      expect(result).toEqual(auditLogs);
    });

    it('should use default limit of 100 when limit is not provided', async () => {
      const auditLogs = [mockAuditLog];
      mockAuditLogService.findAll.mockResolvedValue(auditLogs);

      await controller.findAll('products');

      expect(service.findAll).toHaveBeenCalledWith('products', undefined, 100);
    });
  });

  describe('findByRecord', () => {
    it('should return audit logs for a specific record', async () => {
      const auditLogs = [
        mockAuditLog,
        { ...mockAuditLog, id: 2, action: AuditAction.UPDATE },
      ];
      mockAuditLogService.findByRecord.mockResolvedValue(auditLogs);

      const result = await controller.findByRecord('products', '123e4567-e89b-12d3-a456-426614174000');

      expect(service.findByRecord).toHaveBeenCalledWith('products', '123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(auditLogs);
    });

    it('should return empty array if no audit logs found', async () => {
      mockAuditLogService.findByRecord.mockResolvedValue([]);

      const result = await controller.findByRecord('products', 'non-existent-id');

      expect(service.findByRecord).toHaveBeenCalledWith('products', 'non-existent-id');
      expect(result).toEqual([]);
    });

    it('should handle different table names', async () => {
      const categoryAuditLog = { ...mockAuditLog, table_name: 'categories' };
      mockAuditLogService.findByRecord.mockResolvedValue([categoryAuditLog]);

      const result = await controller.findByRecord('categories', '456e7890-e12b-34d5-a678-901234567890');

      expect(service.findByRecord).toHaveBeenCalledWith('categories', '456e7890-e12b-34d5-a678-901234567890');
      expect(result).toEqual([categoryAuditLog]);
    });
  });

  describe('findOne', () => {
    it('should return a single audit log by ID', async () => {
      mockAuditLogService.findOne.mockResolvedValue(mockAuditLog);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAuditLog);
    });

    it('should return null if audit log not found', async () => {
      mockAuditLogService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should parse string ID to number', async () => {
      mockAuditLogService.findOne.mockResolvedValue(mockAuditLog);

      await controller.findOne('42');

      expect(service.findOne).toHaveBeenCalledWith(42);
    });
  });
});
