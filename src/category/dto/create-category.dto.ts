import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Party Decorations',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'All kinds of party decorations and accessories',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the category',
    example: 'party-popper',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying categories',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
