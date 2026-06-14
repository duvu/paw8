import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, CurrentUser, Roles, Audit } from '../../common/src';
import type { CurrentUserData } from '../../common/src';
import { FilesService } from './files.service';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto/file.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @HttpCode(HttpStatus.OK)
  requestUploadUrl(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.filesService.requestUploadUrl(user.tenantId!, user.sub, dto);
  }

  @Post('confirm')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff')
  @Audit({ action: 'UPLOAD_FILE', entityType: 'file' })
  @HttpCode(HttpStatus.CREATED)
  confirmUpload(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.filesService.confirmUpload(user.tenantId!, user.sub, dto);
  }

  @Get(':id/download-url')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  getDownloadUrl(
    @CurrentUser() user: CurrentUserData,
    @Param('id') fileId: string,
  ) {
    return this.filesService.getDownloadUrl(user.tenantId!, user.sub, fileId);
  }

  @Get('entity/:entityType/:entityId')
  @Roles('tenant_owner', 'tenant_admin', 'store_manager', 'staff', 'accountant')
  listByEntity(
    @CurrentUser() user: CurrentUserData,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.filesService.listByEntity(user.tenantId!, entityType, entityId);
  }

  @Delete(':id')
  @Roles('platform_admin', 'tenant_owner', 'tenant_admin', 'store_manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentUser() user: CurrentUserData,
    @Param('id') fileId: string,
  ) {
    return this.filesService.delete(user.tenantId!, user.sub, fileId);
  }
}
