import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsDecimal, Min, MaxLength, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../interfaces/product-status';
import { UnitType } from '../interfaces/unit-type';
import { SeasonalType } from '../interfaces/seasonal-type.enum';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Stock Keeping Unit', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ description: 'Product barcode', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  barcode: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.ACTIVE })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: UnitType, default: UnitType.UNIT })
  @IsEnum(UnitType)
  @IsOptional()
  unit_type?: UnitType;

@ApiPropertyOptional({ description: 'Units per package' })
  @IsInt()
  @IsOptional()
  @Min(1)
  units_per_package?: number;

  @ApiPropertyOptional({ description: 'Product quantity', default: 0 })
  @IsInt()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Product size', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ enum: SeasonalType, default: SeasonalType.NO })
  @IsEnum(SeasonalType)
  @IsOptional()
  seasonal?: SeasonalType;

  @ApiPropertyOptional({ description: 'Brand IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  brand_ids?: string[];

  @ApiProperty({ description: 'Selling price' })
  @IsDecimal()
  @IsNotEmpty()
  @Type(() => Number)
  selling_price: number;

  @ApiPropertyOptional({ description: 'Cost price' })
  @IsDecimal()
  @IsOptional()
  @Type(() => Number)
  cost_price?: number;

  @ApiPropertyOptional({ description: 'Markup percentage' })
  @IsDecimal()
  @IsOptional()
  @Type(() => Number)
  markup_percentage?: number;

  @ApiPropertyOptional({ description: 'Supplier code', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  supplier_code?: string;

}
