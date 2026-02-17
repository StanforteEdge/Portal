import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { AttachFileDto } from './dto/attach-file.dto';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Files')
@ApiBearerAuth('bearer')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @Permissions('requests.view')
  list(@Query() query: Record<string, any>) {
    return this.filesService.list(query);
  }

  @Post('attach')
  @Permissions('requests.create')
  attach(@Body() dto: AttachFileDto) {
    return this.filesService.attach(dto);
  }
}
