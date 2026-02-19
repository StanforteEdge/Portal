import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

class SignatoryDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Accountant' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateFinanceSettingsDto {
  @ApiPropertyOptional({ type: SignatoryDto })
  @IsOptional()
  @IsObject()
  prepared_by?: SignatoryDto;

  @ApiPropertyOptional({ type: SignatoryDto })
  @IsOptional()
  @IsObject()
  reviewed_by?: SignatoryDto;

  @ApiPropertyOptional({ type: SignatoryDto })
  @IsOptional()
  @IsObject()
  approved_by?: SignatoryDto;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { request_footer: 'Creating shared prosperity.' }
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}
