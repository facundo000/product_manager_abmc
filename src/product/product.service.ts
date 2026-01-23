import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Pricing } from '../pricing/entities/pricing.entity';
import { Brand } from '../brand/entities/brand.entity';

@Injectable()
export class ProductService {
constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Pricing)
    private readonly pricingRepository: Repository<Pricing>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) { }

async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check for duplicate SKU or barcode
      const existingProduct = await queryRunner.manager.findOne(Product, {
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

      // Extract pricing data from DTO
      const { selling_price, cost_price, markup_percentage, brand_ids, ...productData } = createProductDto;

      // Create product
      const product = queryRunner.manager.create(Product, {
        ...productData,
        created_by: userId
      });
      const savedProduct = await queryRunner.manager.save(product);

      // Handle brands if provided
      if (brand_ids && brand_ids.length > 0) {
        const brands = await queryRunner.manager.findByIds(Brand, brand_ids);
        savedProduct.brands = brands;
        await queryRunner.manager.save(savedProduct);
      }

      // Create pricing
      const pricing = queryRunner.manager.create(Pricing, {
        product_id: savedProduct.id,
        selling_price,
        cost_price,
        markup_percentage,
        created_by: userId,
        valid_from: new Date(),
      });
      await queryRunner.manager.save(pricing);

      // Create inventory with initial quantity from product
      const inventory = queryRunner.manager.create(Inventory, {
        product_id: savedProduct.id,
        quantity: productData.quantity || 0,
        min_stock: 0,
      });
      await queryRunner.manager.save(inventory);

      await queryRunner.commitTransaction();

      // Create audit log
      await this.auditLogService.createAuditLog({
        tableName: 'products',
        recordId: savedProduct.id,
        action: AuditAction.CREATE,
        newValues: savedProduct,
        userId: userId,
      });

      // Return product with all relations
      const productWithRelations = await this.productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['brands', 'pricing', 'inventory']
      });

      if (!productWithRelations) {
        throw new NotFoundException('Product not found after creation');
      }

      return productWithRelations;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{ data: Product[]; total: number }> {
    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .leftJoinAndSelect('product.pricing', 'pricing');

    // Filter inactive products by default
    if (!filters?.includeInactive) {
      query.andWhere('product.status != :inactiveStatus', { inactiveStatus: 'inactive' });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Price range filtering
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      query.andWhere('pricing.is_current = :isCurrent', { isCurrent: true });
      if (filters.minPrice !== undefined) {
        query.andWhere('pricing.sale_price >= :minPrice', { minPrice: filters.minPrice });
      }
      if (filters.maxPrice !== undefined) {
        query.andWhere('pricing.sale_price <= :maxPrice', { maxPrice: filters.maxPrice });
      }
    }

    // Category filtering
    if (filters?.categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }

    // Date range filtering
    if (filters?.startDate) {
      query.andWhere('product.created_at >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('product.created_at <= :endDate', { endDate: filters.endDate });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    // Flexible ordering
    const orderBy = filters?.orderBy || 'created_at';
    const orderDirection = filters?.orderDirection || 'DESC';
    query.orderBy(`product.${orderBy}`, orderDirection);

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

  async update(id: string, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
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
    product.updated_by = userId; // Asignar directamente a la entidad
    const updatedProduct = await this.productRepository.save(product); // Guardar la entidad modificada

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: updatedProduct,
      userId: userId,
    });

    return updatedProduct;
  }

  async remove(id: string, userId: string): Promise<Product> {
    const product = await this.findOne(id);

    // Prevent deletion if inventory has stock > 0
    const inventory = await this.inventoryRepository.findOne({ where: { product_id: id } });
    if (inventory && (inventory.quantity ?? 0) > 0) {
      throw new BadRequestException('Cannot delete product with stock greater than 0');
    }

    const oldValues = { ...product };

    // Soft delete: set status to inactive
    product.status = 'inactive' as any;
    product.updated_by = userId;
    const updatedProduct = await this.productRepository.save(product);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: id,
      action: AuditAction.DELETE,
      oldValues,
      newValues: updatedProduct,
      userId,
    });

    return updatedProduct;
  }

  async restore(id: string, userId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.status !== 'inactive') {
      throw new BadRequestException('Product is not inactive');
    }

    const oldValues = { ...product };

    // Restore: set status to active
    product.status = 'active' as any;
    product.updated_by = userId;
    const updatedProduct = await this.productRepository.save(product);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'products',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: updatedProduct,
      userId,
    });

    return updatedProduct;
  }

  async getLowStock(): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventory', 'inventory')
      .where('product.status != :status', { status: 'inactive' })
      .andWhere('inventory.quantity <= inventory.min_stock')
      .andWhere('inventory.quantity IS NOT NULL')
      .getMany();
  }

  async getAuditHistory(id: string): Promise<any[]> {
    return await this.auditLogService.findByRecord('products', id);
  }
}
