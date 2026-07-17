import { IsArray, IsDateString, IsIn, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class StatutoryDeductionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

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

  @ApiPropertyOptional({ description: 'Filter to deductions remitted together under the same payment reference' })
  @IsOptional()
  @IsString()
  remittance_ref?: string;

  @ApiPropertyOptional({ description: 'Filter by TRM/remittance number' })
  @IsOptional()
  @IsString()
  remittance_number?: string;

  @ApiPropertyOptional({ description: 'Filter by linked payment voucher id' })
  @IsOptional()
  @IsUUID()
  payment_voucher_id?: string;

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

  @ApiProperty({ example: 'FIRS/WHT/2026/Q1' })
  @IsString()
  reference!: string;

  @ApiPropertyOptional({ description: 'Account the tax was paid from' })
  @IsOptional()
  @IsUUID()
  paid_from_account_id?: string;

  @ApiPropertyOptional({ description: 'Payment voucher that funded this remittance' })
  @IsOptional()
  @IsUUID()
  payment_voucher_id?: string;

  @ApiPropertyOptional({ description: 'User who created/performed the remittance' })
  @IsOptional()
  @IsString()
  remitted_by?: string;

  @ApiPropertyOptional({ description: 'Remittance receipt file ID' })
  @IsOptional()
  @IsUUID()
  evidence_file_id?: string;

  @ApiPropertyOptional({ type: [String], description: 'Remittance evidence file IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidence_file_ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
