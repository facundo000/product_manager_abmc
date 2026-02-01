import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoice_items')
export class InvoiceItemResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  productId: string;
  productName: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;
}

export class InvoiceResponse {
  id: string;
  number: string;
  total: number;
  itemCount: number;
  status: string;
  paymentMethod: string;
  paymentId: string;
  qrCode: string;
  qrExpiration: Date;
  items: InvoiceItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}
