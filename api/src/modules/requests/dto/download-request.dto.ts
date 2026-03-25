import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DownloadRequestDto {
  @ApiPropertyOptional({
    enum: ['request_pdf', 'pv_pdf', 'request_with_attachments', 'pv_with_attachments', 'full_package', 'full_document'],
    default: 'request_pdf'
  })
  @IsOptional()
  @IsIn(['request_pdf', 'pv_pdf', 'request_with_attachments', 'pv_with_attachments', 'full_package', 'full_document'])
  action?: 'request_pdf' | 'pv_pdf' | 'request_with_attachments' | 'pv_with_attachments' | 'full_package' | 'full_document';

  @ApiPropertyOptional({ description: 'Required for pv_pdf (specific voucher) and pv_with_attachments' })
  @IsOptional()
  @IsUUID()
  voucher_id?: string;

  @ApiPropertyOptional({ enum: ['download', 'email'], default: 'download' })
  @IsOptional()
  @IsIn(['download', 'email'])
  delivery?: 'download' | 'email';

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsString()
  email_to?: string;
}
