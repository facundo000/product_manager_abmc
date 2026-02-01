import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { StockListener } from './stock.listener';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SessionListener } from './session.listener';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Invoice]),
    AuditLogModule,
    SessionModule,
  ],
  providers: [StockListener, SessionListener],
  exports: [StockListener, SessionListener],
})
export class ListenersModule {}
