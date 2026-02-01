import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InvoiceModule } from '../invoice/invoice.module';
import { QrRefreshService } from './qr-refresh.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Product]),
    InvoiceModule,
    ScheduleModule.forRoot(),
  ],
  providers: [PaymentService, QrRefreshService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
