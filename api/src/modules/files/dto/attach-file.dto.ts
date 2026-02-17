import { IsString } from 'class-validator';

export class AttachFileDto {
  @IsString()
  submission_id!: string;

  @IsString()
  field_id!: string;

  @IsString()
  file_url!: string;
}
