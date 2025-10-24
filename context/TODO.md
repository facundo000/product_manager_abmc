// ============================================
// PROYECTO: GESTOR DE PRODUCTOS - COTILLÓN
// ============================================
// Este archivo contiene toda la estructura base del proyecto
// Organize los archivos según la estructura indicada en los comentarios

// ============================================
// FILE: src/entities/user.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { Pricing } from './pricing.entity';
import { AuditLog } from './audit-log.entity';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ select: false })
  password_hash: string;

  @Column({ length: 100 })
  full_name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.created_by_user)
  created_products: Product[];

  @OneToMany(() => Product, (product) => product.updated_by_user)
  updated_products: Product[];

  @OneToMany(() => Pricing, (pricing) => pricing.created_by_user)
  created_pricing: Pricing[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  audit_logs: AuditLog[];
}

// ============================================
// FILE: src/entities/product.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Inventory } from './inventory.entity';
import { Pricing } from './pricing.entity';
import { ProductImage } from './product-image.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

export enum UnitType {
  UNIT = 'unit',
  PACKAGE = 'package',
  BOX = 'box',
}

@Entity('products')
@Index(['barcode'])
@Index(['sku'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ unique: true, length: 100 })
  barcode: string;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({
    type: 'enum',
    enum: UnitType,
    default: UnitType.UNIT,
  })
  unit_type: UnitType;

  @Column({ type: 'int', nullable: true })
  units_per_package: number;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ length: 50, nullable: true })
  size: string;

  @Column({ default: false })
  seasonal: boolean;

  @Column({ length: 100, nullable: true })
  supplier_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  // Relations
  @ManyToOne(() => User, (user) => user.created_products)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @ManyToOne(() => User, (user) => user.updated_products)
  @JoinColumn({ name: 'updated_by' })
  updated_by_user: User;

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory[];

  @OneToMany(() => Pricing, (pricing) => pricing.product)
  pricing: Pricing[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];
}

// ============================================
// FILE: src/entities/category.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  // Self-referencing relation for hierarchical categories
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];
}

// ============================================
// FILE: src/entities/inventory.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  min_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  max_stock: number;

  @Column({ length: 100, nullable: true })
  location: string;

  @UpdateDateColumn()
  last_updated: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.inventory)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

// ============================================
// FILE: src/entities/pricing.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity('pricing')
export class Pricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  selling_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  markup_percentage: number;

  @Column({ length: 3, default: 'ARS' })
  currency: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  valid_from: Date;

  @Column({ type: 'timestamp', nullable: true })
  valid_to: Date;

  @Column({ type: 'uuid' })
  created_by: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Product, (product) => product.pricing)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User, (user) => user.created_pricing)
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;
}

// ============================================
// FILE: src/entities/audit-log.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AuditAction {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_log')
@Index(['table_name', 'record_id'])
@Index(['user_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  table_name: string;

  @Column({ type: 'uuid' })
  record_id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, any>;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.audit_logs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

// ============================================
// FILE: src/entities/product-image.entity.ts
// ============================================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ default: false })
  is_primary: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  // Relations
  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

// ============================================
// FILE: src/entities/index.ts
// ============================================
export { User, UserRole } from './user.entity';
export { Product, ProductStatus, UnitType } from './product.entity';
export { Category } from './category.entity';
export { Inventory } from './inventory.entity';
export { Pricing } from './pricing.entity';
export { AuditLog, AuditAction } from './audit-log.entity';
export { ProductImage } from './product-image.entity';

// ============================================
// FILE: src/products/products.module.ts
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';
import { Inventory } from '../entities/inventory.entity';
import { Pricing } from '../entities/pricing.entity';
import { ProductImage } from '../entities/product-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Inventory, Pricing, ProductImage]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

// ============================================
// FILE: src/products/products.service.ts
// ============================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Inventory } from '../entities/inventory.entity';
import { Pricing } from '../entities/pricing.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Pricing)
    private readonly pricingRepository: Repository<Pricing>,
  ) {}

  // TODO: Implementar métodos CRUD
  async findAll() {
    // Implementar lógica
  }

  async findOne(id: string) {
    // Implementar lógica
  }

  async findByBarcode(barcode: string) {
    // Implementar lógica para escaneo público
  }

  async create(data: any) {
    // Implementar lógica
  }

  async update(id: string, data: any) {
    // Implementar lógica
  }

  async remove(id: string) {
    // Implementar lógica (soft delete)
  }
}

// ============================================
// FILE: src/products/products.controller.ts
// ============================================
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products' })
  async findAll() {
    // TODO: Implementar
  }

  @Get('scan/:barcode')
  @ApiOperation({ summary: 'Scan product by barcode (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Return product details' })
  async scanBarcode(@Param('barcode') barcode: string) {
    // TODO: Implementar endpoint público para escaneo
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 200, description: 'Return product' })
  async findOne(@Param('id') id: string) {
    // TODO: Implementar
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  async create(@Body() data: any) {
    // TODO: Implementar con auditoría
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    // TODO: Implementar con auditoría
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(@Param('id') id: string) {
    // TODO: Implementar soft delete con auditoría
  }
}

// ============================================
// FILE: src/categories/categories.module.ts
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

// ============================================
// FILE: src/categories/categories.service.ts
// ============================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // TODO: Implementar métodos CRUD
  async findAll() {
    // Implementar lógica con árbol jerárquico
  }

  async findOne(id: string) {
    // Implementar lógica
  }

  async findChildren(parentId: string) {
    // Implementar para obtener subcategorías
  }

  async create(data: any) {
    // Implementar lógica
  }

  async update(id: string, data: any) {
    // Implementar lógica
  }

  async remove(id: string) {
    // Implementar lógica
  }
}

// ============================================
// FILE: src/categories/categories.controller.ts
// ============================================
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async findAll() {
    // TODO: Implementar con estructura jerárquica
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({ status: 200, description: 'Return category' })
  async findOne(@Param('id') id: string) {
    // TODO: Implementar
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get subcategories' })
  @ApiResponse({ status: 200, description: 'Return child categories' })
  async findChildren(@Param('id') id: string) {
    // TODO: Implementar
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@Body() data: any) {
    // TODO: Implementar
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    // TODO: Implementar
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  async remove(@Param('id') id: string) {
    // TODO: Implementar
  }
}

// ============================================
// FILE: src/users/users.module.ts
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// ============================================
// FILE: src/users/users.service.ts
// ============================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // TODO: Implementar métodos CRUD
  async findAll() {
    // Implementar lógica
  }

  async findOne(id: string) {
    // Implementar lógica
  }

  async findByEmail(email: string) {
    // Implementar para autenticación
  }

  async findByUsername(username: string) {
    // Implementar para autenticación
  }

  async create(data: any) {
    // Implementar lógica con hash de password
  }

  async update(id: string, data: any) {
    // Implementar lógica
  }

  async remove(id: string) {
    // Implementar lógica (soft delete)
  }

  async updateLastLogin(id: string) {
    // Implementar para tracking de sesiones
  }
}

// ============================================
// FILE: src/users/users.controller.ts
// ============================================
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll() {
    // TODO: Implementar con roles/permisos
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Return user' })
  async findOne(@Param('id') id: string) {
    // TODO: Implementar
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() data: any) {
    // TODO: Implementar con hash de password
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    // TODO: Implementar
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('id') id: string) {
    // TODO: Implementar soft delete
  }
}

// ============================================
// FILE: src/audit/audit.module.ts
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}

// ============================================
// FILE: src/audit/audit.service.ts
// ============================================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  // TODO: Implementar métodos de auditoría
  async createLog(data: {
    tableName: string;
    recordId: string;
    action: AuditAction;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Implementar lógica para crear registro de auditoría
  }

  async findByRecord(tableName: string, recordId: string) {
    // Implementar para obtener historial de un registro
  }

  async findByUser(userId: string) {
    // Implementar para obtener acciones de un usuario
  }

  async findAll(filters?: any) {
    // Implementar con filtros y paginación
  }
}

// ============================================
// FILE: src/audit/audit.controller.ts
// ============================================
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs' })
  @ApiResponse({ status: 200, description: 'Return all audit logs' })
  async findAll(@Query() filters?: any) {
    // TODO: Implementar con filtros y paginación
  }

  @Get('record/:tableName/:recordId')
  @ApiOperation({ summary: 'Get audit history for a specific record' })
  @ApiResponse({ status: 200, description: 'Return audit history' })
  async findByRecord(
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string,
  ) {
    // TODO: Implementar historial de cambios
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs by user' })
  @ApiResponse({ status: 200, description: 'Return user audit logs' })
  async findByUser(@Param('userId') userId: string) {
    // TODO: Implementar
  }
}

// ============================================
// FILE: src/app.module.ts
// ============================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development', // Solo en desarrollo
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    ProductsModule,
    CategoriesModule,
    UsersModule,
    AuditModule,
  ],
})
export class AppModule {}

// ============================================
// INSTRUCCIONES PARA CURSOR AI
// ============================================
/*
PROYECTO: Gestor de Productos para Cotillón

CONTEXTO:
- Sistema de gestión de productos para una tienda de cotillón
- Backend con NestJS + TypeORM + PostgreSQL
- Ya está configurado: Base de datos, variables de entorno y Swagger

REQUERIMIENTOS PRINCIPALES:

1. FUNCIONALIDAD DE ESCANEO (Público):
   - Endpoint GET /products/scan/:barcode
   - Permite consultar productos por código de barras sin autenticación
   - Debe retornar: nombre, descripción, precio de venta, stock disponible

2. SISTEMA DE AUDITORÍA (Registrados):
   - Cada operación CREATE, UPDATE, DELETE debe registrarse en audit_log
   - Capturar: usuario que realizó la acción, valores anteriores y nuevos
   - Implementar interceptor o decorador para automatizar el registro

3. CRUD COMPLETO:
   - Productos (con inventario y precios)
   - Categorías (soporte jerárquico)
   - Usuarios (con roles: admin, employee, viewer)
   
4. VALIDACIÓN:
   - Crear DTOs con class-validator para todos los endpoints
   - Validar datos de entrada en controllers

5. AUTENTICACIÓN Y AUTORIZACIÓN:
   - Implementar guards para proteger endpoints de modificación
   - Solo usuarios autenticados pueden hacer ABMC
   - Endpoint de escaneo debe ser público

ESTRUCTURA DE ARCHIVOS:
src/
├── entities/
│   ├── user.entity.ts
│   ├── product.entity.ts
│   ├── category.entity.ts
│   ├── inventory.entity.ts
│   ├── pricing.entity.ts
│   ├── audit-log.entity.ts
│   ├── product-image.entity.ts
│   └── index.ts
├── products/
│   ├── products.module.ts
│   ├── products.service.ts
│   ├── products.controller.ts
│   └── dto/
│       ├── create-product.dto.ts
│       └── update-product.dto.ts
├── categories/
│   ├── categories.module.ts
│   ├── categories.service.ts
│   ├── categories.controller.ts
│   └── dto/
│       ├── create-category.dto.ts
│       └── update-category.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.service.ts
│   └── audit.controller.ts
├── auth/ (POR IMPLEMENTAR)
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       └── roles.decorator.ts
├── common/
│   ├── interceptors/
│   │   └── audit.interceptor.ts
│   └── decorators/
│       └── audit.decorator.ts
└── app.module.ts

TAREAS PRIORITARIAS PARA IMPLEMENTAR:

1. **DTOs con Validación**
   - Crear DTOs para Create y Update de cada entidad
   - Usar decoradores de class-validator (@IsString, @IsNumber, etc.)
   - Validar campos requeridos y opcionales

2. **Implementar Lógica de Servicios**
   - ProductsService: CRUD + findByBarcode
   - CategoriesService: CRUD + árbol jerárquico
   - UsersService: CRUD + hash de passwords
   - AuditService: registro y consulta de logs

3. **Implementar Controllers**
   - Completar todos los endpoints marcados con TODO
   - Añadir validación con ValidationPipe
   - Implementar paginación en listados

4. **Sistema de Auditoría Automática**
   - Crear interceptor que capture cambios en productos
   - Registrar automáticamente en audit_log
   - Capturar IP y User-Agent del request

5. **Autenticación JWT** (opcional para MVP)
   - Módulo de autenticación
   - Login endpoint
   - Guards para proteger rutas
   - Roles decorator

CONSIDERACIONES TÉCNICAS:

- **Soft Delete**: Usar campo 'status' en lugar de eliminar registros
- **Transacciones**: Para operaciones que involucren múltiples tablas
- **Relaciones**: Usar eager loading donde sea necesario
- **Índices**: Ya están definidos en barcode, sku, y audit fields
- **Validación**: Usar ValidationPipe global en main.ts
- **Paginación**: Implementar con skip/take en queries
- **Manejo de errores**: Usar HttpException apropiadas

ENDPOINTS CLAVE A IMPLEMENTAR:

PÚBLICOS:
- GET /products/scan/:barcode - Consulta de precio por código de barras

PROTEGIDOS (requieren autenticación):
- GET /products - Listar productos (con paginación)
- POST /products - Crear producto
- PUT /products/:id - Actualizar producto
- DELETE /products/:id - Eliminar producto (soft delete)
- GET /audit/record/:tableName/:recordId - Historial de cambios

DEPENDENCIAS NECESARIAS:
- class-validator
- class-transformer
- @nestjs/passport
- @nestjs/jwt
- bcrypt
- passport-jwt

EJEMPLO DE DTO A CREAR:

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus, UnitType } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  barcode: string;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ enum: UnitType })
  @IsEnum(UnitType)
  @IsOptional()
  unit_type?: UnitType;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  units_per_package?: number;

  // ... más campos según sea necesario
}

EJEMPLO DE IMPLEMENTACIÓN DE SERVICIO:

async findByBarcode(barcode: string): Promise<any> {
  const product = await this.productRepository.findOne({
    where: { barcode, status: ProductStatus.ACTIVE },
    relations: ['pricing', 'inventory'],
  });

  if (!product) {
    throw new NotFoundException('Product not found');
  }

  const currentPrice = product.pricing.find(p => !p.valid_to);
  const currentInventory = product.inventory[0];

  return {
    name: product.name,
    description: product.description,
    price: currentPrice?.selling_price,
    currency: currentPrice?.currency,
    stock: currentInventory?.quantity || 0,
    available: currentInventory?.quantity > 0,
  };
}

EJEMPLO DE INTERCEPTOR DE AUDITORÍA:

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, ip, headers } = request;

    return next.handle().pipe(
      tap(async (data) => {
        if (['POST', 'PUT', 'DELETE'].includes(method)) {
          await this.auditService.createLog({
            tableName: 'products', // Detectar dinámicamente
            recordId: data.id,
            action: method === 'POST' ? AuditAction.INSERT : 
                   method === 'PUT' ? AuditAction.UPDATE : 
                   AuditAction.DELETE,
            newValues: data,
            userId: user.id,
            ipAddress: ip,
            userAgent: headers['user-agent'],
          });
        }
      }),
    );
  }
}

NOTAS IMPORTANTES:
- El código base está completo, solo falta implementar la lógica
- Prioriza el endpoint de escaneo y el sistema de auditoría
- Implementa validaciones robustas en todos los endpoints
- Usa transacciones para operaciones críticas
- Documenta todos los endpoints con Swagger

¿NECESITAS ALGO MÁS?
Si necesitas ejemplos específicos de alguna implementación o 
tienes dudas sobre algún patrón, por favor pregunta.
*/