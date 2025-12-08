import { IsDecimal, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePricingDto {
    @IsNotEmpty()
    @IsUUID()
    product_id: string;
  
    @IsOptional()
    @IsDecimal()
    cost_price?: number;
  
    @IsNotEmpty()
    @IsDecimal()
    selling_price: number;
  
    @IsOptional()
    @IsDecimal()
    markup_percentage?: number;
  
    @IsOptional()
    @IsString()
    currency?: string;
}
