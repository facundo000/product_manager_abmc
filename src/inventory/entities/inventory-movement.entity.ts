import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Inventory } from './inventory.entity';

export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventory_id: string;

  @Column({ type: 'int' })
  amount: number; // positive for IN, negative for OUT

  @Column({
    type: 'enum',
    enum: InventoryMovementType,
    default: InventoryMovementType.ADJUST,
  })
  type: InventoryMovementType;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Inventory, (inventory) => inventory.movements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;
}
