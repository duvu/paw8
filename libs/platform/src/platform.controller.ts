import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../../common/src';
import { PlatformService } from './platform.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('platform')
@ApiBearerAuth()
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @Roles('platform_admin')
  getStats() {
    return this.platformService.getStats();
  }

  @Get('activity')
  @Roles('platform_admin')
  getRecentActivity() {
    return this.platformService.getRecentActivity();
  }
}
