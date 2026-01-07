import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../product/entities/product.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';

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

    const movementRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const auditLogServiceMock = {
      createAuditLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Product), useValue: { ...repoMock } },
        { provide: getRepositoryToken(Inventory), useValue: { ...repoMock } },
        { provide: getRepositoryToken(InventoryMovement), useValue: { ...repoMock } },
        { provide: AuditLogService, useValue: { createAuditLog: jest.fn() } },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productRepo = module.get(getRepositoryToken(Product));
    inventoryRepo = module.get(getRepositoryToken(Inventory));
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
      // ARRANGE
      const createDto = {
        product_id: 'pid',
        quantity: 10,
        location: 'Warehouse A',
        min_stock: 5
      };
      
      const mockProduct = {
        id: 'pid',
        name: 'Product 1',
        sku: 'SKU123'        
      };
      
      const mockInventory = {
        id: 'inv1',
        product_id: 'pid',
        quantity: 10,
        location: 'Warehouse A'
      };
      // Mock del productRepo.findOne
      productRepo.findOne.mockResolvedValue(mockProduct as any);      
      // Mock de que NO existe inventario previo (para crear uno nuevo)
      inventoryRepo.findOne.mockResolvedValue(null);
      inventoryRepo.create.mockReturnValue(mockInventory as any);
      inventoryRepo.save.mockResolvedValue(mockInventory as any);

      // ACT
      const result = await service.create(createDto);

       // Verifica que guardó el inventario
      expect(productRepo.findOne).toHaveBeenCalledWith({
         where: { id: 'pid' } 
      });

      expect(inventoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 'pid',
          quantity: 10,
          location: 'Warehouse A',
          min_stock: 5
        })
      );

      expect(inventoryRepo.save).toHaveBeenCalled();
      
      expect(auditLogService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'inventory',   
          recordId: 'inv1',          
          action: 'CREATE',
          userId: 'user1',           
          newValues: expect.objectContaining({
            id: 'inv1',
            product_id: 'pid',
            quantity: 10,
            location: 'Warehouse A'
          })
        })
      );

      expect(result).toEqual(mockInventory);

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
      // ARRANGE
      const mockInventory = {
        id: 'inv1',
        product_id: 'pid',
        quantity: 2,
        location: 'Warehouse A'
      };
      
      const adjustDto = {
        amount: 3,
        type: InventoryMovementType.IN,
        reason: 'stock in'
      };
      
      const mockMovement = {
        id: 'mov1',
        inventory_id: 'inv1',
        type: InventoryMovementType.IN,
        amount: 3,
        reason: 'stock in'
      };
      // Mock del inventario existente
      inventoryRepo.findOne.mockResolvedValue(mockInventory as any);

      // Mock que devuelve el inventario con quantity actualizada (2 + 3 = 5)
      inventoryRepo.save.mockResolvedValue({
        ...mockInventory,
        quantity: 5
      } as any);

      movementRepo.create.mockImplementation(mockMovement as any);
      movementRepo.save.mockResolvedValue(mockMovement as any);

      // ACT
      const res = await service.adjust('inv1', adjustDto, 'user1');
      
      // ASSERT
      expect(res.quantity).toBe(5);
      expect(movementRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mov1',
          inventory_id: 'inv1',
          type: InventoryMovementType.IN,
          amount: 3,
          reason: 'stock in'
        })
      );      
      expect(movementRepo.create).toHaveBeenCalled();
      expect(auditLogService.createAuditLog).toHaveBeenCalledTimes(2); // inventory update + movement create

      expect(inventoryRepo.save).toHaveBeenCalled();
    });

    it('decreases quantity when movement type is OUT', async () => {
      // ARRANGE
      const mockInventory = {
        id: 'inv1',
        quantity: 10
      };
      
      const adjustDto = {
        amount: 3,
        type: InventoryMovementType.OUT,
        reason: 'sale'
      };

      inventoryRepo.findOne.mockResolvedValue(mockInventory as any);
      
      // Cantidad después de restar: 10 - 3 = 7
      inventoryRepo.save.mockResolvedValue({
        ...mockInventory,
        quantity: 7
      } as any);
      
      movementRepo.create.mockReturnValue({} as any);
      movementRepo.save.mockResolvedValue({} as any);

      // ACT
      const res = await service.adjust('inv1', adjustDto, 'user1');
      
      // ASSERT
      expect(res.quantity).toBe(7);
      
      expect(inventoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 7
        })
      );
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
