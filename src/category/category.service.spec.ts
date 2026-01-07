import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe.skip('CategoryService', () => {
  let service: CategoryService;
  let repository: Repository<Category>;
  let auditLogService: AuditLogService;

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditLogService = {
    createAuditLog: jest.fn(),
    findByRecord: jest.fn(),
  };

  const mockCategory = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Party Decorations',
    description: 'All party items',
    parent_id: null,
    icon: 'party-popper',
    sort_order: 1,
    is_active: true,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    created_by: '987e6543-e21b-98d7-a654-123456789000',
    updated_by: null,
    parent: null,
    children: [],
    products: [],
  } as unknown as Category;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<Repository<Category>>(getRepositoryToken(Category));
    auditLogService = module.get<AuditLogService>(AuditLogService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = '987e6543-e21b-98d7-a654-123456789000';
    const createDto = {
      name: 'Party Decorations',
      description: 'All party items',
      parent_id: undefined,
      icon: 'party-popper',
      sort_order: 1,
      is_active: true,
    };

    it('should create a category successfully', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);
      mockAuditLogService.createAuditLog.mockResolvedValue({});

      const result = await service.create(createDto, userId);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name, parent_id: expect.anything() },
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...createDto,
        created_by: userId,
      });
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(mockCategory);
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should throw ConflictException if category name exists at same level', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(createDto, userId)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if parent category does not exist', async () => {
      const dtoWithParent = { ...createDto, parent_id: 'non-existent-id' };
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoWithParent, userId)).rejects.toThrow(NotFoundException);
    });

    it('should validate parent exists when parent_id is provided', async () => {
      const parentCategory = { ...mockCategory, id: 'parent-id' };
      const dtoWithParent = { ...createDto, parent_id: 'parent-id' };

      mockCategoryRepository.findOne
        .mockResolvedValueOnce(parentCategory) // parent lookup
        .mockResolvedValueOnce(null); // duplicate check
      mockCategoryRepository.create.mockReturnValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);
      mockAuditLogService.createAuditLog.mockResolvedValue({});

      await service.create(dtoWithParent, userId);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'parent-id' },
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories without filters', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(mockCategoryRepository.createQueryBuilder).toHaveBeenCalledWith('category');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('category.sort_order', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('category.name', 'ASC');
      expect(result).toEqual([mockCategory]);
    });

    it('should filter by parent_id', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ parent_id: 'parent-id' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.parent_id = :parent_id',
        { parent_id: 'parent-id' }
      );
    });

    it('should filter by is_active', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ is_active: true });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.is_active = :is_active',
        { is_active: true }
      );
    });

    it('should search by name or description', async () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      };

      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll({ search: 'party' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: '%party%' }
      );
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        relations: ['parent', 'children'],
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findChildren', () => {
    it('should return children of a category', async () => {
      const children = [{ ...mockCategory, id: 'child-1', parent_id: mockCategory.id }];
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.find.mockResolvedValue(children);

      const result = await service.findChildren(mockCategory.id);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        where: { parent_id: mockCategory.id, is_active: true },
        order: { sort_order: 'ASC', name: 'ASC' },
      });
      expect(result).toEqual(children);
    });

    it('should throw NotFoundException if parent category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findChildren('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const userId = '987e6543-e21b-98d7-a654-123456789000';
    const updateDto = {
      name: 'Updated Name',
    };

    it('should update a category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...updateDto };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(updatedCategory);
      mockAuditLogService.createAuditLog.mockResolvedValue({});

      const result = await service.update(mockCategory.id, updateDto, userId);

      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if trying to set self as parent', async () => {
      const invalidDto = { ...updateDto, parent_id: mockCategory.id };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.update(mockCategory.id, invalidDto, userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if new name already exists at same level', async () => {
      const updateDtoWithNewName = { ...updateDto, name: 'Existing Category Name' };
      const existingCategory = { ...mockCategory, id: 'different-id', name: 'Existing Category Name' };

      mockCategoryRepository.findOne
        .mockResolvedValueOnce(mockCategory) // findOne for update
        .mockResolvedValueOnce(existingCategory); // duplicate check

      await expect(service.update(mockCategory.id, updateDtoWithNewName, userId)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a category successfully', async () => {
      const categoryToDelete = { ...mockCategory };
      mockCategoryRepository.findOne.mockResolvedValue(categoryToDelete);
      mockCategoryRepository.count.mockResolvedValue(0);
      mockCategoryRepository.remove.mockResolvedValue(categoryToDelete);
      mockAuditLogService.createAuditLog.mockResolvedValue({});

      await service.remove(mockCategory.id, '987e6543-e21b-98d7-a654-123456789000');

      expect(mockCategoryRepository.remove).toHaveBeenCalled();
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category has children', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.count.mockResolvedValue(2);

      await expect(
        service.remove(mockCategory.id, '987e6543-e21b-98d7-a654-123456789000')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', '987e6543-e21b-98d7-a654-123456789000')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a category', async () => {
      const deactivatedCategory = { ...mockCategory, is_active: false };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(deactivatedCategory);
      mockAuditLogService.createAuditLog.mockResolvedValue({});

      const result = await service.softDelete(mockCategory.id, '987e6543-e21b-98d7-a654-123456789000');

      expect(result.is_active).toBe(false);
      expect(mockAuditLogService.createAuditLog).toHaveBeenCalled();
    });
  });

  describe('getAuditHistory', () => {
    it('should return audit history for a category', async () => {
      const auditLogs = [{ id: 1, action: 'CREATE' }, { id: 2, action: 'UPDATE' }];
      mockAuditLogService.findByRecord.mockResolvedValue(auditLogs);

      const result = await service.getAuditHistory(mockCategory.id);

      expect(mockAuditLogService.findByRecord).toHaveBeenCalledWith('categories', mockCategory.id);
      expect(result).toEqual(auditLogs);
    });
  });
});
