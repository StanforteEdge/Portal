import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '1' })
  id!: string;
  @ApiProperty({ example: 'olalekan@stanforteedge.com' })
  email!: string;
  @ApiProperty({ example: 'olalekan' })
  username!: string | null;
  @ApiProperty({ example: ['admin'] })
  roles!: string[];
  @ApiProperty({ example: ['*'] })
  permissions!: string[];
  @ApiProperty({ required: false, example: ['finance'] })
  enabled_modules?: string[];
  @ApiProperty({ required: false, example: { id: '1', name: 'Stanforte Edge', code: 'STE' } })
  organization?: {
    id: string;
    name: string;
    code: string;
  };
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;
  @ApiProperty()
  refreshToken!: string;
  @ApiProperty({ example: '15m' })
  expiresIn!: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class AuthStatusResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;
  @ApiProperty({ example: 'olalekan@stanforteedge.com' })
  email!: string;
  @ApiProperty({ example: 'olalekan' })
  username!: string | null;
  @ApiProperty({ example: 'active' })
  status!: string;
  @ApiProperty({ example: ['admin'] })
  roles!: string[];
  @ApiProperty({ example: ['*'] })
  permissions!: string[];
  @ApiProperty({ required: false, example: ['finance'] })
  enabled_modules?: string[];
  @ApiProperty({ required: false, example: 'profile_pending' })
  onboarding_status?: string;
}
