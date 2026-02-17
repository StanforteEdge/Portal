import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  organization_id?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
