import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly auditLogService: AuditLogService,
  ) { }

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    // Validate parent category exists if provided
    if (createCategoryDto.parent_id) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parent_id },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${createCategoryDto.parent_id} not found`);
      }

      // Prevent circular references (optional but recommended)
      if (parentCategory.parent_id === createCategoryDto.parent_id) {
        throw new BadRequestException('Cannot create circular category hierarchy');
      }
    }

    // Check for duplicate name at the same level
    const existingCategory = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
        parent_id: createCategoryDto.parent_id || IsNull(),
      },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name "${createCategoryDto.name}" already exists at this level`);
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      created_by: userId,
    });
    const savedCategory = await this.categoryRepository.save(category);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'categories',
      recordId: savedCategory.id,
      action: AuditAction.CREATE,
      newValues: savedCategory,
      userId: userId,
    });

    return savedCategory;
  }

  async findAll(filters?: {
    parent_id?: string;
    is_active?: boolean;
    search?: string;
    includeInactive?: boolean;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Category[]> {
    const query = this.categoryRepository.createQueryBuilder('category');

    // Filter inactive categories by default
    if (!filters?.includeInactive) {
      query.andWhere('category.is_active = :isActive', { isActive: true });
    }

    if (filters?.parent_id !== undefined) {
      if (filters.parent_id === null || filters.parent_id === 'null') {
        query.andWhere('category.parent_id IS NULL');
      } else {
        query.andWhere('category.parent_id = :parent_id', { parent_id: filters.parent_id });
      }
    }

    if (filters?.is_active !== undefined) {
      query.andWhere('category.is_active = :is_active', { is_active: filters.is_active });
    }

    if (filters?.search) {
      query.andWhere(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Flexible ordering
    const orderBy = filters?.orderBy || 'sort_order';
    const orderDirection = filters?.orderDirection || 'ASC';
    query.orderBy(`category.${orderBy}`, orderDirection);

    if (orderBy !== 'name') {
      query.addOrderBy('category.name', 'ASC');
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findChildren(id: string): Promise<Category[]> {
    // First verify parent exists
    await this.findOne(id);

    return await this.categoryRepository.find({
      where: { parent_id: id, is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async findTree(): Promise<Category[]> {
    // Get all root categories (no parent)
    const rootCategories = await this.categoryRepository.find({
      where: { parent_id: IsNull(), is_active: true },
      relations: ['children'],
      order: { sort_order: 'ASC', name: 'ASC' },
    });

    // Recursively load children
    for (const root of rootCategories) {
      await this.loadChildrenRecursively(root);
    }

    return rootCategories;
  }

  private async loadChildrenRecursively(category: Category): Promise<void> {
    if (category.children && category.children.length > 0) {
      for (const child of category.children) {
        const fullChild = await this.categoryRepository.findOne({
          where: { id: child.id },
          relations: ['children'],
        });
        if (fullChild) {
          child.children = fullChild.children;
          await this.loadChildrenRecursively(child);
        }
      }
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string): Promise<Category> {
    const category = await this.findOne(id);

    // Validate parent category if being updated
    if (updateCategoryDto.parent_id) {
      // Prevent self-reference
      if (updateCategoryDto.parent_id === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parent_id },
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${updateCategoryDto.parent_id} not found`);
      }

      // Prevent circular references
      await this.validateNoCircularReference(id, updateCategoryDto.parent_id);
    }

    // Check for duplicate name if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: updateCategoryDto.name,
          parent_id: updateCategoryDto.parent_id || category.parent_id || IsNull(),
        },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(`Category with name "${updateCategoryDto.name}" already exists at this level`);
      }
    }

    const oldValues = { ...category };

    // Update category
    Object.assign(category, updateCategoryDto);
    category.updated_by = userId;
    const updatedCategory = await this.categoryRepository.save(category);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'categories',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: updatedCategory,
      userId: userId,
    });

    return updatedCategory;
  }

  private async validateNoCircularReference(categoryId: string, newParentId: string): Promise<void> {
    let currentParentId = newParentId;
    const visited = new Set<string>([categoryId]);

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException('Cannot create circular category hierarchy');
      }

      visited.add(currentParentId);

      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
        select: ['id', 'parent_id'],
      });

      if (!parent) break;
      currentParentId = parent.parent_id;
    }
  }

  async remove(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has children
    const childrenCount = await this.categoryRepository.count({
      where: { parent_id: id, is_active: true },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete category with active subcategories. Delete or reassign subcategories first.');
    }

    // Check if category has active products
    if (category.products && category.products.length > 0) {
      const activeProducts = category.products.filter(p => p.status !== 'inactive');
      if (activeProducts.length > 0) {
        throw new BadRequestException(`Cannot delete category with ${activeProducts.length} active product(s). Remove or reassign products first.`);
      }
    }

    // Use soft delete instead of hard delete
    return await this.softDelete(id, userId);
  }

  async softDelete(id: string, userId: string): Promise<Category> {
    const category = await this.findOne(id);

    const oldValues = { ...category };
    category.is_active = false;
    category.updated_by = userId;

    const updatedCategory = await this.categoryRepository.save(category);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'categories',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: { ...updatedCategory, _action: 'soft_delete' },
      userId,
    });

    return updatedCategory;
  }

  async getAuditHistory(id: string): Promise<any[]> {
    return await this.auditLogService.findByRecord('categories', id);
  }

  async restore(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.is_active) {
      throw new BadRequestException('Category is already active');
    }

    const oldValues = { ...category };
    category.is_active = true;
    category.updated_by = userId;

    const updatedCategory = await this.categoryRepository.save(category);

    // Create audit log
    await this.auditLogService.createAuditLog({
      tableName: 'categories',
      recordId: id,
      action: AuditAction.UPDATE,
      oldValues,
      newValues: { ...updatedCategory, _action: 'restore' },
      userId,
    });

    return updatedCategory;
  }
}
