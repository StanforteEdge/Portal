import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateFinanceReceiptDto {
  @ApiPropertyOptional({ example: 'RCPT-2026-0001' })
  @IsOptional()
  @IsString()
  receipt_number?: string;

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  sales_invoice_id?: string;

  @ApiProperty({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsUUID()
  account_id!: string;

  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({ example: '2026-03-18' })
  @IsOptional()
  @IsDateString()
  received_at?: string;

  @ApiPropertyOptional({ example: 'Bank transfer ref' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
