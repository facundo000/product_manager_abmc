import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../interfaces/product-status';
import { UnitType } from '../interfaces/unit-type';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  barcode: string;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty({ enum: UnitType })
  unit_type: UnitType;

  @ApiPropertyOptional()
  units_per_package?: number;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  size?: string;

  @ApiProperty()
  seasonal: boolean;

  @ApiPropertyOptional()
  supplier_code?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  created_by: string;

  @ApiPropertyOptional()
  updated_by?: string;
}

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  limit?: number;

  @ApiPropertyOptional()
  offset?: number;
}
