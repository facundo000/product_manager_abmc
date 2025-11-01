import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateInventoryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  min_stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  max_stock?: number;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  location?: string;
}
