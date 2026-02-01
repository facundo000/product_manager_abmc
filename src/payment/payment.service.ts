import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as qrcode from 'qrcode';
import { Invoice, InvoiceStatus } from '../invoice/entities/invoice.entity';
import { InvoiceService } from '../invoice/invoice.service';

interface MercadoPagoOrder {
  qr_data: string;
  [key: string]: any;
}

interface MercadoPagoWebhookData {
  type: string;
  data: {
    id: string;
  };
}

@Injectable()
export class PaymentService {
  private accessToken: string;
  private userId: string;
  private posId: string;
  private webhookSecret: string;
  private apiUrl: string;
  private qrExpirationHours: number;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    private invoiceService: InvoiceService,
    private eventEmitter: EventEmitter2,
  ) {
    this.accessToken = this.configService.get<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
    ) || '';
    this.userId = this.configService.get<string>('MERCADO_PAGO_USER_ID') || '';
    this.posId = this.configService.get<string>('MERCADO_PAGO_POS_ID') || '';
    this.webhookSecret = this.configService.get<string>('WEBHOOK_SECRET') || '';
    this.apiUrl = this.configService.get<string>('API_URL') || '';
    this.qrExpirationHours = this.configService.get<number>(
      'QR_EXPIRATION_HOURS',
      24,
    );

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.accessToken || !this.userId || !this.posId) {
      throw new InternalServerErrorException(
        'Mercado Pago configuration is incomplete. Please check environment variables.',
      );
    }
  }

  async processPaymentMercadoPago(invoiceId: string): Promise<{
    qrUrl: string;
    qrData: string;
    expiresAt: Date;
  }> {
    // Get invoice and validate
    const invoice = await this.invoiceService.getInvoiceById(invoiceId);

    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `Invoice must be in PENDING status to process payment. Current status: ${invoice.status}`,
      );
    }

    if (invoice.qrCode && invoice.qrExpiration > new Date()) {
      throw new BadRequestException(
        'Invoice already has an active QR code',
      );
    }

    try {
      // Create Mercado Pago order
      const orderData = {
        external_reference: invoiceId,
        title: `Invoice ${invoice.number}`,
        description: `Payment for invoice ${invoice.number} with ${invoice.itemCount} items`,
        total_amount: invoice.total,
        items: invoice.items.map((item) => ({
          sku_number: item.product.sku,
          category: 'product',
          title: item.product.name,
          unit_price: Number(item.unitPrice),
          quantity: item.quantity,
          unit_measure: 'unit',
          total_amount: Number(item.subtotal),
        })),
      };

      // Call Mercado Pago API to create QR order
      const order = await this.createMercadoPagoOrder(orderData);

      if (!order.qr_data) {
        throw new InternalServerErrorException(
          'Failed to generate QR data from Mercado Pago',
        );
      }

      // Generate QR code image
      const qrUrl = await qrcode.toDataURL(order.qr_data);
      const expiresAt = this.calculateQRExpiration();

      // Update invoice with QR code
      await this.invoiceService.updateInvoiceQR(invoiceId, qrUrl, expiresAt);

      return {
        qrUrl,
        qrData: order.qr_data,
        expiresAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to process Mercado Pago payment: ${error.message}`,
      );
    }
  }

  async handleMercadoPagoWebhook(
    webhookData: MercadoPagoWebhookData,
  ): Promise<void> {
    try {
      const { type, data } = webhookData;

      if (type !== 'payment') {
        return;
      }

      // Fetch payment details from Mercado Pago
      const paymentDetails = await this.getMercadoPagoPaymentDetails(data.id);

      if (paymentDetails.status !== 'approved') {
        return;
      }

      const externalReference = paymentDetails.external_reference;

      if (!externalReference) {
        throw new BadRequestException(
          'Payment does not have external_reference (invoice ID)',
        );
      }

      // Update invoice status
      const invoice = await this.invoiceService.updateInvoicePaymentStatus(
        externalReference,
        InvoiceStatus.PAID,
        paymentDetails.id,
      );

      // Emit event for stock reduction
      this.eventEmitter.emit('invoice.paid', { invoice });
    } catch (error) {
      console.error('Error handling Mercado Pago webhook:', error);
      throw new InternalServerErrorException(
        'Failed to process payment webhook',
      );
    }
  }

  async refreshExpiredQRs(): Promise<{ refreshed: number; failed: number }> {
    try {
      const expiredQRs = await this.invoiceService.getExpiredQRs();

      let refreshed = 0;
      let failed = 0;

      for (const invoice of expiredQRs) {
        try {
          await this.processPaymentMercadoPago(invoice.id);
          refreshed++;
        } catch (error) {
          console.error(`Failed to refresh QR for invoice ${invoice.id}:`, error);
          failed++;
        }
      }

      return { refreshed, failed };
    } catch (error) {
      console.error('Error refreshing expired QRs:', error);
      throw new InternalServerErrorException('Failed to refresh QRs');
    }
  }

  private async createMercadoPagoOrder(
    orderData: any,
  ): Promise<MercadoPagoOrder> {
    try {
      // Using REST API directly since SDK may not support all endpoints
      const response = await fetch(
        `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${this.userId}/pos/${this.posId}/qrs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new InternalServerErrorException(
          `Mercado Pago API error: ${errorData.message || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create Mercado Pago order: ${error.message}`,
      );
    }
  }

  private async getMercadoPagoPaymentDetails(paymentId: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new InternalServerErrorException(
          `Failed to fetch payment details: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to get Mercado Pago payment details: ${error.message}`,
      );
    }
  }

  private calculateQRExpiration(): Date {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + this.qrExpirationHours);
    return expirationDate;
  }

  verifyWebhookSignature(
    signature: string,
    body: Buffer,
  ): boolean {
    // Implement signature verification based on Mercado Pago webhook format
    // For now, basic implementation
    if (!signature || !this.webhookSecret) {
      return false;
    }

    // Mercado Pago uses x-signature header with hash verification
    // This is a placeholder - implement actual verification logic
    return true;
  }
}
