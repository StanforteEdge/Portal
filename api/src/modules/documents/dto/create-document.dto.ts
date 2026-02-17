import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  form_id!: string;

  @IsString()
  submitted_by_profile_id!: string;

  @IsOptional()
  @IsObject()
  values?: Record<string, unknown>;
}
