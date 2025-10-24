import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Omit created_by from CreateProductDto and make all fields optional
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['created_by'] as const)
) {
  @ApiProperty({ description: 'User ID who updates the product' })
  @IsString()
  @IsNotEmpty()
  updated_by: string;
}
