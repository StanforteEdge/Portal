import { IsArray, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RequestItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsNumber()
  total_amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items?: RequestItemDto[];
}
