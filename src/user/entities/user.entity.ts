import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../../product/entities/product.entity";
import { Pricing } from "../../pricing/entities/pricing.entity";
import { ValidRoles } from "src/auth/interface/valid-roles";

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
      enum: ValidRoles,
      default: ValidRoles.VIEWER,
    })
    role: ValidRoles;
  
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
    pricing: Pricing[];
}
