import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let repository: Repository<AuditLog>;

  const mockAuditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

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
  } as unknown as AuditLog;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuditLog', () => {
    it('should create and save an audit log', async () => {
      const params = {
        tableName: 'products',
        recordId: '123e4567-e89b-12d3-a456-426614174000',
        action: AuditAction.CREATE,
        newValues: { name: 'Test Product', sku: 'TEST-001' },
        userId: '987e6543-e21b-98d7-a654-123456789000',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockAuditLogRepository.create.mockReturnValue(mockAuditLog);
      mockAuditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(params);

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        table_name: params.tableName,
        record_id: params.recordId,
        action: params.action,
        old_values: undefined,
        new_values: params.newValues,
        user_id: params.userId,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      });
      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should create audit log with old and new values for UPDATE action', async () => {
      const params = {
        tableName: 'products',
        recordId: '123e4567-e89b-12d3-a456-426614174000',
        action: AuditAction.UPDATE,
        oldValues: { name: 'Old Product', sku: 'OLD-001' },
        newValues: { name: 'New Product', sku: 'NEW-001' },
        userId: '987e6543-e21b-98d7-a654-123456789000',
      };

      const updateAuditLog = { ...mockAuditLog, action: AuditAction.UPDATE, old_values: params.oldValues };
      mockAuditLogRepository.create.mockReturnValue(updateAuditLog);
      mockAuditLogRepository.save.mockResolvedValue(updateAuditLog);

      const result = await service.createAuditLog(params);

      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        table_name: params.tableName,
        record_id: params.recordId,
        action: params.action,
        old_values: params.oldValues,
        new_values: params.newValues,
        user_id: params.userId,
        ip_address: undefined,
        user_agent: undefined,
      });
      expect(result).toEqual(updateAuditLog);
    });
  });

  describe('findAll', () => {
    it('should return all audit logs without filters', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(mockAuditLogRepository.createQueryBuilder).toHaveBeenCalledWith('audit_log');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('audit_log.created_at', 'DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual([mockAuditLog]);
    });

    it('should filter by table name', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('products');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.table_name = :tableName',
        { tableName: 'products' }
      );
      expect(result).toEqual([mockAuditLog]);
    });

    it('should filter by record ID', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(undefined, '123e4567-e89b-12d3-a456-426614174000');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.record_id = :recordId',
        { recordId: '123e4567-e89b-12d3-a456-426614174000' }
      );
      expect(result).toEqual([mockAuditLog]);
    });

    it('should apply custom limit', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(undefined, undefined, 50);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should filter by both table name and record ID', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      mockAuditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll('products', '123e4567-e89b-12d3-a456-426614174000', 25);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(25);
      expect(result).toEqual([mockAuditLog]);
    });
  });

  describe('findByRecord', () => {
    it('should return audit logs for a specific record', async () => {
      const auditLogs = [mockAuditLog, { ...mockAuditLog, id: 2, action: AuditAction.UPDATE }];
      mockAuditLogRepository.find.mockResolvedValue(auditLogs);

      const result = await service.findByRecord('products', '123e4567-e89b-12d3-a456-426614174000');

      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        where: { table_name: 'products', record_id: '123e4567-e89b-12d3-a456-426614174000' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(auditLogs);
    });

    it('should return empty array if no audit logs found', async () => {
      mockAuditLogRepository.find.mockResolvedValue([]);

      const result = await service.findByRecord('products', 'non-existent-id');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single audit log by ID', async () => {
      mockAuditLogRepository.findOne.mockResolvedValue(mockAuditLog);

      const result = await service.findOne(1);

      expect(mockAuditLogRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockAuditLog);
    });

    it('should return null if audit log not found', async () => {
      mockAuditLogRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(mockAuditLogRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeNull();
    });
  });
});
