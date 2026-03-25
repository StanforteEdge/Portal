import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class UpsertFinanceBudgetLineDto {
  @ApiProperty({ example: 'Equipment and field materials' })
  @IsString()
  line_label!: string;

  @ApiProperty({ example: 200000 })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class UpsertFinanceBudgetDto {
  @ApiProperty({ example: 'GESP Q2 Project Budget' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'project' })
  @IsOptional()
  @IsString()
  budget_type?: string;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be 3-letter ISO code' })
  currency?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  organization_id?: string;

  @ApiPropertyOptional({ example: '4' })
  @IsOptional()
  @IsString()
  team_id?: string;

  @ApiPropertyOptional({ example: '7' })
  @IsOptional()
  @IsString()
  project_id?: string;

  @ApiPropertyOptional({ example: 'a4c5ad31-9200-4701-a019-b5ca8f9c6167' })
  @IsOptional()
  @IsUUID()
  fund_id?: string;

  @ApiPropertyOptional({ example: '5d28da17-d0ef-4d00-bf6c-efc5e9efbb62' })
  @IsOptional()
  @IsUUID()
  grant_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [UpsertFinanceBudgetLineDto],
    example: [{ line_label: 'Equipment and field materials', amount: 200000 }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertFinanceBudgetLineDto)
  lines!: UpsertFinanceBudgetLineDto[];
}
