import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({
    type: LoginDto,
    examples: {
      default: {
        value: { email: 'olalekan@stanforteedge.com', password: 'ChangeMe123!' }
      }
    }
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  status(@Req() req: any) {
    return this.authService.status(req.user?.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  logout(@Req() req: any) {
    return this.authService.logout(req.user?.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      default: {
        value: {
          current_password: 'ChangeMe123!',
          new_password: 'NewStrong123!',
          confirm_password: 'NewStrong123!'
        }
      }
    }
  })
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user?.id, dto);
  }

  @Post('refresh')
  @ApiBody({
    type: RefreshDto,
    examples: {
      default: {
        value: { refresh_token: 'your-refresh-token' }
      }
    }
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Post('forgot-password')
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      default: {
        value: { email: 'olalekan@stanforteedge.com' }
      }
    }
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      default: {
        value: { token: 'reset-token-from-email', new_password: 'NewStrong123!' }
      }
    }
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
