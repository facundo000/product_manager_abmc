import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Pricing } from '../pricing/entities/pricing.entity';
import { Brand } from '../brand/entities/brand.entity';
import { BrandModule } from '../brand/brand.module';

@Module({
imports: [
    TypeOrmModule.forFeature([Product, Inventory, Pricing]),
    AuditLogModule,
    BrandModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
