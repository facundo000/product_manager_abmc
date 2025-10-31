import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    AuditLogModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
