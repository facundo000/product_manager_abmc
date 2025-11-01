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
    const repoMock = {
      findOne: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: { ...repoMock } },
        { provide: getRepositoryToken(Inventory), useValue: { ...repoMock } },
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
      (service as any).findOne = jest.fn().mockResolvedValue({ id: 'p1' });
      inventoryRepo.findOne.mockResolvedValue({ id: 'inv1', quantity: 2 } as any);
      await expect(service.remove('p1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
      expect(productRepo.remove).not.toHaveBeenCalled();
    });

    it('allows deletion when no inventory or quantity 0 and logs audit', async () => {
      (service as any).findOne = jest.fn().mockResolvedValue({ id: 'p1' });
      inventoryRepo.findOne.mockResolvedValue({ id: 'inv1', quantity: 0 } as any);
      productRepo.remove.mockResolvedValue(undefined as any);

      await service.remove('p1', 'u1');
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
      expect(productRepo.remove).toHaveBeenCalled();
    });
  });
});
