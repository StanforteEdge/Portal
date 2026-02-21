import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsUUID()
  from_account_id!: string;

  @ApiProperty({ example: '4d1f529a-e5cc-4112-b80f-80ad4b43cf9f' })
  @IsUUID()
  to_account_id!: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ example: 'TRF-1001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Move funds to petty cash account' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2026-02-20T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  transfer_at?: string;
}

