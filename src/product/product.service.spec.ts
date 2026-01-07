import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BadRequestException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let auditLogService: { createAuditLog: jest.Mock };

  beforeEach(async () => {
    const productRepoMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByBarcode: jest.fn(),
      findBySku: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),        
      remove: jest.fn(),
      restore: jest.fn(),
      getLowStock: jest.fn(),
      getAuditHistory: jest.fn()
    };

    const inventoryRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: productRepoMock }, // ← SIN spread
        { provide: getRepositoryToken(Inventory), useValue: inventoryRepoMock }, // ← SIN spread
        { provide: AuditLogService, useValue: { createAuditLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepo = module.get(getRepositoryToken(Product));
    inventoryRepo = module.get(getRepositoryToken(Inventory));
    auditLogService = module.get(AuditLogService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
  it('throws BadRequest when product has stock > 0', async () => {
    const mockProduct = { id: 'p1', status: 'active' };
    
    (service as any).findOne = jest.fn().mockResolvedValue(mockProduct);
    inventoryRepo.findOne.mockResolvedValue({ id: 'inv1', quantity: 2 } as any);
    
    await expect(service.remove('p1', 'u1')).rejects.toThrow(BadRequestException);
    expect(productRepo.save).not.toHaveBeenCalled();
  });

  it('allows deletion when no inventory or quantity 0 and logs audit', async () => {
    const mockProduct = {
      id: 'p1',
      status: 'active',
      updated_by: null,
      name: 'Test Product'
    };

    (service as any).findOne = jest.fn().mockResolvedValue(mockProduct);
    inventoryRepo.findOne.mockResolvedValue({ id: 'inv1', quantity: 0 } as any);
    
    productRepo.save.mockResolvedValue({
      ...mockProduct,
      status: 'inactive',
      updated_by: 'u1'
    } as any);

    const result = await service.remove('p1', 'u1');
    
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'inactive',
        updated_by: 'u1'
      })
    );

    expect(auditLogService.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tableName: 'products',
        recordId: 'p1',
        action: 'DELETE',
        userId: 'u1'
      })
    );

    expect(result.status).toBe('inactive');
  });
});
});