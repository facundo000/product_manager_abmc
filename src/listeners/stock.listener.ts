import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class StockListener {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private dataSource: DataSource,
    private auditLogService: AuditLogService,
  ) {}

  @OnEvent('invoice.paid')
  async handleInvoicePaid(payload: { invoice: Invoice }): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invoice = payload.invoice;

      // Fetch full invoice with items if not already loaded
      let fullInvoice = invoice;
      if (!invoice.items || invoice.items.length === 0) {
        fullInvoice = (await queryRunner.manager.findOne(Invoice, {
          where: { id: invoice.id },
          relations: ['items', 'items.product'],
        })) as Invoice;
      }

      // Reduce stock for each item in the invoice
      for (const item of fullInvoice.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.product.id },
        });

        if (!product) {
          throw new Error(`Product with id ${item.product.id} not found`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Current: ${product.quantity}, Required: ${item.quantity}`,
          );
        }

        const oldQuantity = product.quantity;
        product.quantity -= item.quantity;
        product.updated_at = new Date();

        await queryRunner.manager.save(product);

        // Audit log for stock reduction
        await this.auditLogService.createAuditLog({
          tableName: 'products',
          recordId: product.id,
          action: AuditAction.UPDATE,
          oldValues: { quantity: oldQuantity },
          newValues: { quantity: product.quantity },
        });
      }

      await queryRunner.commitTransaction();
      console.log(
        `Successfully reduced stock for invoice ${fullInvoice.number}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error reducing stock for paid invoice:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
