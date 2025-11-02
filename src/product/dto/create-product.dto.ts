import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../interfaces/product-status';
import { UnitType } from '../interfaces/unit-type';

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

  @ApiPropertyOptional({ description: 'Product color', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ description: 'Product size', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({ description: 'Is seasonal product', default: false })
  @IsBoolean()
  @IsOptional()
  seasonal?: boolean;

  @ApiPropertyOptional({ description: 'Supplier code', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  supplier_code?: string;

}
