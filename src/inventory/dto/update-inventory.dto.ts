import { PartialType } from '@nestjs/swagger';
import { CreateInventoryDto } from './create-inventory.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateInventoryDto extends PartialType(
  OmitType(CreateInventoryDto, ['quantity'] as const),
) {}
