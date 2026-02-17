import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code_prefix?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  storage_type?: 'form' | 'special' | 'bypass';

  @IsOptional()
  @IsUUID()
  form_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
