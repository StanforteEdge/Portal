import { IsOptional, IsString } from 'class-validator';

export class DisburseRequestDto {
  @IsOptional()
  @IsString()
  note?: string;
}
