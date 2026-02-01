import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus, PaymentMethod } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
    private auditLogService: AuditLogService,
  ) {}

  async createInvoice(
    createInvoiceDto: CreateInvoiceDto,
    user: User,
  ): Promise<Invoice> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate all products and stock availability
      let total = 0;
      const itemsData: {
        product: Product;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }[] = [];

      for (const itemDto of createInvoiceDto.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id ${itemDto.productId} not found`,
          );
        }

        if (product.quantity < itemDto.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${itemDto.quantity}`,
          );
        }

        const subtotal = Number(itemDto.unitPrice) * itemDto.quantity;
        total += subtotal;

        itemsData.push({
          product,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          subtotal,
        });
      }

      // Create invoice
      const invoiceNumber = await this.generateInvoiceNumber();
      const invoice = queryRunner.manager.create(Invoice, {
        number: invoiceNumber,
        total,
        itemCount: createInvoiceDto.items.length,
        status: InvoiceStatus.PENDING,
        createdBy: user,
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      // Create invoice items
      for (const itemData of itemsData) {
        const invoiceItem = queryRunner.manager.create(InvoiceItem, {
          invoice: savedInvoice,
          product: itemData.product,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          subtotal: itemData.subtotal,
        });
        await queryRunner.manager.save(invoiceItem);
      }

      await queryRunner.commitTransaction();

      // Audit log
      await this.auditLogService.createAuditLog({
        tableName: 'invoices',
        recordId: savedInvoice.id,
        action: AuditAction.CREATE,
        newValues: { invoice: savedInvoice },
        userId: user.id,
      });

      const createdInvoice = await this.invoiceRepository.findOne({
        where: { id: savedInvoice.id },
        relations: ['items', 'items.product', 'createdBy'],
      });

      return createdInvoice as Invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['items', 'items.product', 'createdBy'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${invoiceId} not found`);
    }

    return invoice;
  }

  async updateInvoicePaymentStatus(
    invoiceId: string,
    status: InvoiceStatus,
    paymentId?: string,
  ): Promise<Invoice> {
    const invoice = (await this.getInvoiceById(invoiceId)) as Invoice;

    if (paymentId) {
      invoice.paymentId = paymentId;
    }
    invoice.status = status;
    invoice.updatedAt = new Date();

    const updated = await this.invoiceRepository.save(invoice);

    // Audit log
    await this.auditLogService.createAuditLog({
      tableName: 'invoices',
      recordId: invoiceId,
      action: AuditAction.UPDATE,
      oldValues: { status: invoice.status, paymentId: invoice.paymentId },
      newValues: { status: updated.status, paymentId: updated.paymentId },
    });

    return updated;
  }

  async updateInvoiceQR(
    invoiceId: string,
    qrCode: string,
    qrExpiration: Date,
  ): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId);

    invoice.qrCode = qrCode;
    invoice.qrExpiration = qrExpiration;
    invoice.updatedAt = new Date();

    return await this.invoiceRepository.save(invoice);
  }

  async getAllInvoices(
    page: number = 1,
    limit: number = 10,
    status?: InvoiceStatus,
  ): Promise<{ data: Invoice[]; total: number; page: number; limit: number }> {
    const query = this.invoiceRepository.createQueryBuilder('invoice');

    if (status) {
      query.where('invoice.status = :status', { status });
    }

    query.leftJoinAndSelect('invoice.items', 'items');
    query.leftJoinAndSelect('items.product', 'product');
    query.leftJoinAndSelect('invoice.createdBy', 'createdBy');
    query.orderBy('invoice.createdAt', 'DESC');

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async getExpiredQRs(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PENDING,
        qrExpiration: new Date(),
      },
      relations: ['items', 'items.product', 'createdBy'],
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const lastInvoice = await this.invoiceRepository.findOne({
      order: { createdAt: 'DESC' },
    });

    if (!lastInvoice) {
      return 'INV-0001';
    }

    const lastNumber = parseInt(lastInvoice.number.split('-')[1]);
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `INV-${newNumber}`;
  }
}
