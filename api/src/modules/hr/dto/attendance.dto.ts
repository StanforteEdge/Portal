import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class ClockAttendanceDto {
  @ApiPropertyOptional({ enum: ['web', 'mobile', 'admin', 'import'] })
  @IsOptional()
  @IsString()
  @IsIn(['web', 'mobile', 'admin', 'import'])
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  at?: string;
}
