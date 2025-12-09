import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { Pricing } from '../pricing/entities/pricing.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(Pricing)
    private readonly pricingRepo: Repository<Pricing>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async getStats() {
    const totalProducts = await this.productRepo.count();
    const activeProducts = await this.productRepo.count({
      where: { status: 'active' as any },
    });
    const inactiveProducts = await this.productRepo.count({
      where: { status: 'inactive' as any },
    });

    const totalCategories = await this.categoryRepo.count();
    const activeCategories = await this.categoryRepo.count({
      where: { is_active: true },
    });

    const lowStockCount = await this.inventoryRepo
      .createQueryBuilder('inv')
      .where('inv.is_active = :isActive', { isActive: true })
      .andWhere('inv.quantity <= inv.min_stock')
      .getCount();

    const inventoryValue = await this.inventoryRepo
      .createQueryBuilder('inv')
      .leftJoin('inv.product', 'product')
      .leftJoin('product.pricing', 'pricing')
      .select('SUM(inv.quantity * pricing.selling_price)', 'total')
      .where('inv.is_active = :isActive', { isActive: true })
      .andWhere('product.status = :status', { status: 'active' })
      .andWhere('pricing.currency = :currency', { currency: 'ARS' })
      .getRawOne();

    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo.count({
      where: { is_active: true },
    });

    const totalInventoryItems = await this.inventoryRepo.count({
      where: { is_active: true },
    });

    const totalStockQuantity = await this.inventoryRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.quantity)', 'total')
      .where('inv.is_active = :isActive', { isActive: true })
      .getRawOne();

    return {
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
      },
      categories: {
        total: totalCategories,
        active: activeCategories,
      },
      inventory: {
        totalItems: totalInventoryItems,
        totalQuantity: parseInt(totalStockQuantity?.total || '0'),
        lowStockCount,
        estimatedValue: parseFloat(inventoryValue?.total || '0'),
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
    };
  }
}
