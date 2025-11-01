import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryMovementType } from './entities/inventory-movement.entity';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

  beforeEach(async () => {
    const serviceMock: Partial<Record<keyof InventoryService, any>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      getLowStock: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      adjust: jest.fn(),
      getHistory: jest.fn(),
      remove: jest.fn(),
      findByProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get(InventoryService) as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to service', async () => {
    (service.create as jest.Mock).mockResolvedValue({ id: 'inv1' });
    const res = await controller.create({ product_id: 'p1', quantity: 1, min_stock: 0 } as any, { id: 'u1' } as any);
    expect(service.create).toHaveBeenCalled();
    expect(res).toEqual({ id: 'inv1' });
  });

  it('findAll returns list', async () => {
    (service.findAll as jest.Mock).mockResolvedValue([{ id: 'i1' }]);
    const res = await controller.findAll();
    expect(res).toEqual([{ id: 'i1' }]);
  });

  it('lowStock returns list', async () => {
    (service.getLowStock as jest.Mock).mockResolvedValue([{ id: 'i1' }]);
    const res = await controller.lowStock();
    expect(res).toEqual([{ id: 'i1' }]);
  });

  it('findOne returns item', async () => {
    (service.findOne as jest.Mock).mockResolvedValue({ id: 'i1' });
    const res = await controller.findOne('i1');
    expect(res).toEqual({ id: 'i1' });
  });

  it('update delegates to service', async () => {
    (service.update as jest.Mock).mockResolvedValue({ id: 'i1' });
    const res = await controller.update('i1', { min_stock: 2 } as any, { id: 'u1' } as any);
    expect(service.update).toHaveBeenCalledWith('i1', { min_stock: 2 });
    expect(res).toEqual({ id: 'i1' });
  });

  it('adjust delegates to service', async () => {
    (service.adjust as jest.Mock).mockResolvedValue({ id: 'i1', quantity: 5 });
    const res = await controller.adjust('i1', { amount: 3, type: InventoryMovementType.IN }, { id: 'u1' } as any);
    expect(service.adjust).toHaveBeenCalled();
    expect(res).toEqual({ id: 'i1', quantity: 5 });
  });

  it('history calls service', async () => {
    (service.getHistory as jest.Mock).mockResolvedValue([{ id: 'm1' }]);
    const res = await controller.history('i1');
    expect(res).toEqual([{ id: 'm1' }]);
  });

  it('remove returns void', async () => {
    (service.remove as jest.Mock).mockResolvedValue(undefined);
    await controller.remove('i1', { id: 'u1' } as any);
    expect(service.remove).toHaveBeenCalledWith('i1');
  });
});
