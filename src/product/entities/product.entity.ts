import { Column, CreateDateColumn, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProductStatus } from "../interfaces/product-status";
import { UnitType } from "../interfaces/unit-type";
import { SeasonalType } from "../interfaces/seasonal-type.enum";
import { User } from "../../user/entities/user.entity";
import { Category } from "../../category/entities/category.entity";
import { Inventory } from "../../inventory/entities/inventory.entity";
import { Pricing } from "../../pricing/entities/pricing.entity";
import { ProductImage } from "../../product-image/entities/product-image.entity";
import { Brand } from "../../brand/entities/brand.entity";

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
  
    @Column({ type: 'int', default: 0 })
    quantity: number;
  
    @Column({ length: 50, nullable: true })
    size: string;
   
    @Column({
      type: 'enum',
      enum: SeasonalType,
      default: SeasonalType.NO,
    })
    seasonal: SeasonalType;
  
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
   
    @ManyToMany(() => Brand, (brand) => brand.products)
    @JoinTable({
      name: 'product_brands',
      joinColumn: { name: 'product_id', referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'brand_id', referencedColumnName: 'id' },
    })
    brands: Brand[];
}
