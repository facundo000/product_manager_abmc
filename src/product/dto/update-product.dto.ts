import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Omit created_by from CreateProductDto and make all fields optional
export class UpdateProductDto extends PartialType(
  CreateProductDto// OmitType(, ['created_by'] as const)
) {
}
