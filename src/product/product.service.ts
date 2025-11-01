import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';
import { Inventory } from '../inventory/entities/inventory.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check for duplicate SKU or barcode
    const existingProduct = await this.productRepository.findOne({
      where: [
        { sku: createProductDto.sku },
        { barcode: createProductDto.barcode },
      ],
    });

    if (existingProduct) {
      if (existingProduct.sku === createProductDto.sku) {
        throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
      }
      if (existingProduct.barcode === createProductDto.barcode) {
        throw new ConflictException(`Product with barcode ${createProductDto.barcode} already exists`);
      }
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: savedProduct.id,
      action: AuditAction.CREATE,
      newValues: savedProduct,
      userId: createProductDto.created_by,
    });

    return savedProduct;
  }

  async findAll(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Product[]; total: number }> {
    const query = this.productRepository.createQueryBuilder('product');

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('product.created_at', 'DESC');

    const data = await query.getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { barcode } });

    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { sku } });

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Check for duplicate SKU or barcode if they are being updated
    if (updateProductDto.sku || updateProductDto.barcode) {
      const duplicateCheck = await this.productRepository.findOne({
        where: [
          updateProductDto.sku ? { sku: updateProductDto.sku } : {},
          updateProductDto.barcode ? { barcode: updateProductDto.barcode } : {},
        ],
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        if (duplicateCheck.sku === updateProductDto.sku) {
          throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
        }
        if (duplicateCheck.barcode === updateProductDto.barcode) {
          throw new ConflictException(`Product with barcode ${updateProductDto.barcode} already exists`);
        }
      }
    }

    const oldValues = { ...product };

    // Update product
    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: updatedProduct,
      userId: updateProductDto.updated_by,
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.findOne(id);

    // Prevent deletion if inventory has stock > 0
    const inventory = await this.inventoryRepository.findOne({ where: { product_id: id } });
    if (inventory && (inventory.quantity ?? 0) > 0) {
      throw new BadRequestException('Cannot delete product with stock greater than 0');
    }

    // Create audit log before deletion
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: id,
      action: AuditAction.DELETE,
      oldValues: product,
      userId,
    });

    await this.productRepository.remove(product);
  }

  async getAuditHistory(id: string): Promise<any[]> {
    return await this.auditLogService.findByRecord('products', id);
  }
}
