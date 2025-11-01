import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { InventoryMovementType } from '../entities/inventory-movement.entity';

export class AdjustInventoryDto {
  @ApiProperty({ minimum: 1, description: 'Cantidad a ajustar. Para OUT el servicio restará.' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType; // IN | OUT | ADJUST

  @ApiPropertyOptional({ description: 'Motivo del ajuste' })
  @IsOptional()
  @IsString()
  reason?: string;
}
