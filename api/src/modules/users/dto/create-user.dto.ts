import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'jdoe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'jdoe@stanforteedge.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'ChangeMe123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: 'staff' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: [String], example: ['staff'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  primary_organization_id?: string;
}
