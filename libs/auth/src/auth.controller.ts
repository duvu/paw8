import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, RefreshTokenDto } from './dto/auth.dto';
import { CurrentUser, CurrentUserData } from '../../common/src/decorators/current-user.decorator';
import { Public } from '../../common/src/decorators/public.decorator';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 200 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 200 } })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: CurrentUserData) {
    await this.authService.logout(user.sub);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.sub, user.tenantId, dto);
  }
}
