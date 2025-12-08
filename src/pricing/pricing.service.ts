import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Pricing } from './entities/pricing.entity';
import { Product } from 'src/product/entities/product.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class PricingService {
  constructor(
      @InjectRepository(Pricing)
      private readonly pricingRepository: Repository<Pricing>,
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ) {}
  
  async create(createPricingDto: CreatePricingDto, userId: string): Promise<Pricing> {
    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: createPricingDto.product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${createPricingDto.product_id} not found`);
    }

    // Calculate markup if not provided
    let { cost_price, selling_price, markup_percentage } = createPricingDto;
    if (cost_price && !markup_percentage) {
      markup_percentage = Number((((selling_price - cost_price) / cost_price) * 100).toFixed(2));
    }

    // Invalidate previous active price
    await this.invalidatePreviousPricing(createPricingDto.product_id);

    // Create new pricing
    const pricing = this.pricingRepository.create({
      ...createPricingDto,
      markup_percentage,
      created_by: userId,
      valid_from: new Date(),
    });

    return this.pricingRepository.save(pricing);
  }

  async findCurrentByProductId(productId: string): Promise<Pricing | null> {
    return this.pricingRepository.findOne({
      where: {
        product_id: productId,
        valid_to: IsNull(),
      },
      order: { valid_from: 'DESC' },
    });
  }

  async findHistoryByProductId(productId: string): Promise<Pricing[]> {
    return this.pricingRepository.find({
      where: { product_id: productId },
      order: { valid_from: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePricingDto: UpdatePricingDto,
    userId: string,
  ): Promise<Pricing> {
    const existingPricing = await this.pricingRepository.findOne({
      where: { id },
    });

    if (!existingPricing) {
      throw new NotFoundException(`Pricing with ID ${id} not found`);
    }

    // If this is the current active price, update it
    if (!existingPricing.valid_to) {
      return this.create(
        {
          product_id: existingPricing.product_id,
          cost_price: updatePricingDto.cost_price ?? existingPricing.cost_price,
          selling_price: updatePricingDto.selling_price ?? existingPricing.selling_price,
          currency: updatePricingDto.currency ?? existingPricing.currency,
        },
        userId,
      );
    }

    // If updating a historical price, just update it directly
    return this.pricingRepository.save({
      ...existingPricing,
      ...updatePricingDto,
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.pricingRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Pricing with ID ${id} not found`);
    }
  }

  private async invalidatePreviousPricing(productId: string): Promise<void> {
    const now = new Date();
    await this.pricingRepository.update(
      {
        product_id: productId,
        valid_to: IsNull(),
      },
      { valid_to: now },
    );
  }
}
