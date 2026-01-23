import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto, userId: string): Promise<Brand> {
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });

    if (existingBrand) {
      throw new ConflictException(`Brand with name ${createBrandDto.name} already exists`);
    }

    const brand = this.brandRepository.create({
      ...createBrandDto,
      created_by: userId,
    });

    return await this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return await this.brandRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id } });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, userId: string): Promise<Brand> {
    const brand = await this.findOne(id);

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existingBrand = await this.brandRepository.findOne({
        where: { name: updateBrandDto.name },
      });
      if (existingBrand) {
        throw new ConflictException(`Brand with name ${updateBrandDto.name} already exists`);
      }
    }

    Object.assign(brand, updateBrandDto);
    brand.updated_by = userId;

    return await this.brandRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    // Note: We might want to check if products are using this brand before deleting
    // or just let the database handle it with a foreign key constraint.
    await this.brandRepository.remove(brand);
  }
}
