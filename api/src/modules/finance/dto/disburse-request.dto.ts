import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DisburseRequestDto {
  @ApiPropertyOptional({ example: 'Approved and transferred to requester account.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'bank_transfer' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: 'STN240217001' })
  @IsOptional()
  @IsString()
  transaction_ref?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 'f3e8b369-0eca-454f-a8f8-46b780bc6264' })
  @IsOptional()
  @IsUUID()
  evidence_file_id?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  evidence_file_ids?: string[];

  @ApiPropertyOptional({ example: '3fef7e86-cf6a-4df7-b0b3-e350adf55e33' })
  @IsOptional()
  @IsUUID()
  paid_from_account_id?: string;
}
