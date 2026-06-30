import { IsArray, IsDateString, IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class StatutoryDeductionsQueryDto {
  @ApiPropertyOptional({ enum: ['pending', 'remitted'] })
  @IsOptional()
  @IsIn(['pending', 'remitted'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deduction_type_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  request_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumberString()
  per_page?: string;
}

export class RemitStatutoryDeductionsDto {
  @ApiProperty({ type: [String], description: 'IDs of FinanceRequestDeduction to mark as remitted' })
  @IsArray()
  @IsUUID('4', { each: true })
  deduction_ids!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  remitted_at?: string;

  @ApiProperty({ example: 'WHT-2026-Q1-remittance' })
  @IsString()
  reference!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
