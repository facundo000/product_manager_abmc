import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './entities/inventory.entity';
import { Product } from '../product/entities/product.entity';
import { InventoryMovement, InventoryMovementType } from './entities/inventory-movement.entity';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepo: Repository<InventoryMovement>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const { product_id } = createInventoryDto;

    const product = await this.productRepo.findOne({ where: { id: product_id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }

    const existing = await this.inventoryRepo.findOne({ where: { product_id } });
    if (existing) {
      throw new BadRequestException('Inventory for this product already exists');
    }

    const inventory = this.inventoryRepo.create(createInventoryDto);
    const saved = await this.inventoryRepo.save(inventory);

    await this.auditLogService.createAuditLog({
      tableName: 'inventory',
      recordId: saved.id,
      action: AuditAction.CREATE,
      newValues: saved,
    });

    return saved;
  }

  async findAll(): Promise<Inventory[]> {
    return await this.inventoryRepo.find();
  }

  async findOne(id: string): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({ where: { id } });
    if (!inv) throw new NotFoundException(`Inventory with ID ${id} not found`);
    return inv;
  }

  async findByProduct(productId: string): Promise<Inventory> {
    const inv = await this.inventoryRepo.findOne({ where: { product_id: productId } });
    if (!inv) throw new NotFoundException(`Inventory for product ${productId} not found`);
    return inv;
  }

  async update(id: string, dto: UpdateInventoryDto): Promise<Inventory> {
    const inv = await this.findOne(id);
    const oldValues = { ...inv };
    Object.assign(inv, dto);
    const saved = await this.inventoryRepo.save(inv);

    await this.auditLogService.createAuditLog({
      tableName: 'inventory',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: saved,
    });

    return saved;
  }

  async remove(id: string): Promise<void> {
    const inv = await this.findOne(id);

    await this.auditLogService.createAuditLog({
      tableName: 'inventory',
      recordId: id,
      action: AuditAction.DELETE,
      oldValues: inv,
    });

    await this.inventoryRepo.remove(inv);
  }

  async adjust(id: string, dto: AdjustInventoryDto, userId?: string): Promise<Inventory> {
    const inv = await this.findOne(id);

    const delta = dto.type === InventoryMovementType.OUT ? -dto.amount : dto.amount;
    const newQty = (inv.quantity ?? 0) + delta;
    if (newQty < 0) {
      throw new BadRequestException('Resulting stock cannot be negative');
    }

    const oldValues = { quantity: inv.quantity };
    inv.quantity = newQty;
    const saved = await this.inventoryRepo.save(inv);

    const movement = this.movementRepo.create({
      inventory_id: inv.id,
      amount: delta,
      type: dto.type,
      reason: dto.reason,
      created_by: userId,
    });
    await this.movementRepo.save(movement);

    await this.auditLogService.createAuditLog({
      tableName: 'inventory',
      recordId: inv.id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: { quantity: saved.quantity },
      userId,
    });

    await this.auditLogService.createAuditLog({
      tableName: 'inventory_movements',
      recordId: movement.id,
      action: AuditAction.CREATE,
      newValues: movement,
      userId,
    });

    return saved;
  }

  async getLowStock(): Promise<Inventory[]> {
    return await this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.quantity <= inv.min_stock')
      .getMany();
  }

  async getHistory(id: string): Promise<InventoryMovement[]> {
    await this.findOne(id);
    return await this.movementRepo.find({ where: { inventory_id: id }, order: { created_at: 'DESC' } });
  }
}
