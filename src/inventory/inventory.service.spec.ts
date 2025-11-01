import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../product/entities/product.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepo: jest.Mocked<Repository<Inventory>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let movementRepo: jest.Mocked<Repository<InventoryMovement>>;
  let auditLogService: { createAuditLog: jest.Mock };

  beforeEach(async () => {
    const repoMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Inventory), useValue: { ...repoMock } },
        { provide: getRepositoryToken(Product), useValue: { ...repoMock } },
        { provide: getRepositoryToken(InventoryMovement), useValue: { ...repoMock } },
        { provide: AuditLogService, useValue: { createAuditLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepo = module.get(getRepositoryToken(Inventory));
    productRepo = module.get(getRepositoryToken(Product));
    movementRepo = module.get(getRepositoryToken(InventoryMovement));
    auditLogService = module.get(AuditLogService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFound when product does not exist', async () => {
      productRepo.findOne.mockResolvedValue(null as any);
      await expect(
        service.create({ product_id: 'pid', quantity: 0, min_stock: 0 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequest when inventory already exists', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'pid' } as any);
      inventoryRepo.findOne.mockResolvedValue({ id: 'inv1' } as any);
      await expect(
        service.create({ product_id: 'pid', quantity: 0, min_stock: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates inventory and logs audit', async () => {
      productRepo.findOne.mockResolvedValue({ id: 'pid' } as any);
      inventoryRepo.findOne.mockResolvedValue(null as any);
      const entity = { id: 'inv1' } as any;
      inventoryRepo.create.mockReturnValue(entity);
      inventoryRepo.save.mockResolvedValue(entity);
      await service.create({ product_id: 'pid', quantity: 5, min_stock: 1 });
      expect(inventoryRepo.create).toHaveBeenCalled();
      expect(inventoryRepo.save).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalled();
    });
  });

  describe('adjust', () => {
    it('prevents negative stock on OUT', async () => {
      inventoryRepo.findOne.mockResolvedValue({ id: 'inv1', quantity: 0 } as any);
      await expect(
        service.adjust('inv1', { amount: 1, type: InventoryMovementType.OUT }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates movement and updates quantity', async () => {
      const inv = { id: 'inv1', quantity: 2 } as any;
      inventoryRepo.findOne.mockResolvedValue(inv);
      inventoryRepo.save.mockResolvedValue(inv as any);
      movementRepo.create.mockImplementation((m) => ({ id: 'mov1', ...m } as any));
      movementRepo.save.mockResolvedValue({ id: 'mov1' } as any);

      const res = await service.adjust('inv1', { amount: 3, type: InventoryMovementType.IN, reason: 'stock in' }, 'user1');
      expect(res.quantity).toBe(5);
      expect(movementRepo.create).toHaveBeenCalled();
      expect(movementRepo.save).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalledTimes(2); // inventory update + movement create
    });
  });

  describe('findByProduct', () => {
    it('returns inventory by product_id', async () => {
      const inv = { id: 'inv1', product_id: 'pid' } as any;
      inventoryRepo.findOne.mockResolvedValue(inv);
      const res = await service.findByProduct('pid');
      expect(res).toBe(inv);
    });

    it('throws NotFound when no inventory for product', async () => {
      inventoryRepo.findOne.mockResolvedValue(null as any);
      await expect(service.findByProduct('pid')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
