import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
    eager: false,
  })
  invoice: Invoice;

  @ManyToOne(() => Product, { eager: false, nullable: false })
  product: Product;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false })
  subtotal: number;
}
