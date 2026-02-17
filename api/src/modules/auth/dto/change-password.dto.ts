import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  current_password!: string;

  @IsString()
  @MinLength(8)
  new_password!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  confirm_password?: string;
}
