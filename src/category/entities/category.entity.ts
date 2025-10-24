import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../../product/entities/product.entity";

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
