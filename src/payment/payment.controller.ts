import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process/:invoiceId')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
  })
  async processPayment(
    @Param('invoiceId') invoiceId: string,
  ): Promise<{ qrUrl: string; qrData: string; expiresAt: Date }> {
    if (!invoiceId) {
      throw new BadRequestException('invoiceId is required');
    }
    return await this.paymentService.processPaymentMercadoPago(invoiceId);
  }

  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Body() webhookData: any,
    @Headers('x-signature') signature: string,
  ): Promise<{ status: string }> {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }

    // Verify signature (optional validation)
    // const isValid = this.paymentService.verifyWebhookSignature(signature, req.rawBody);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    await this.paymentService.handleMercadoPagoWebhook(webhookData);

    return { status: 'success' };
  }
}
