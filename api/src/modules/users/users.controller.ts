import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
@ApiTags('Users')
@ApiBearerAuth('bearer')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() req: any) {
    return this.usersService.getMyProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMyProfile(req.user.id, dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.manage')
  list(@Query() query: Record<string, any>) {
    return this.usersService.listUsers(query);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('users.manage')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }
}
