import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Product } from "../../product/entities/product.entity";
import { User } from "../../user/entities/user.entity";

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({ type: 'uuid', nullable: true })
    parent_id: string;
  
    @Column({ length: 50, nullable: true })
    icon: string;
  
    @Column({ type: 'int', default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ type: 'uuid' })
    created_by: string;

    @Column({ type: 'uuid', nullable: true })
    updated_by: string;

    // Relations
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    created_by_user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updated_by_user: User;

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
