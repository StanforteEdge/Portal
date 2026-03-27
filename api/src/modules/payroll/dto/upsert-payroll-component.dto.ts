import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertPayrollComponentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chart_account_id?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(60)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  name!: string;

  @ApiProperty({ enum: ['earning', 'deduction', 'employer_cost'] })
  @IsIn(['earning', 'deduction', 'employer_cost'])
  component_type!: 'earning' | 'deduction' | 'employer_cost';

  @ApiPropertyOptional({ enum: ['fixed', 'formula', 'percentage'], default: 'fixed' })
  @IsOptional()
  @IsIn(['fixed', 'formula', 'percentage'])
  calculation_type?: 'fixed' | 'formula' | 'percentage';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_taxable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_statutory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
