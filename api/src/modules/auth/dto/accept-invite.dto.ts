import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(8)
  new_password!: string;

  @ApiProperty({ required: false, example: 'ChangeMe123!' })
  @IsOptional()
  @IsString()
  confirm_password?: string;
}

