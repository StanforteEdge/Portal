import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List uploaded files from central file table' })
  list(@Query() query: Record<string, any>) {
    return this.filesService.list(query);
  }

  @Post()
  @Permissions('requests.create')
  @ApiOperation({ summary: 'Create file asset record' })
  @ApiBody({
    type: AttachFileDto,
    examples: {
      invoice: {
        value: {
          storage_disk: 'local',
          storage_path: 'uploads/requests/invoice-001.pdf',
          file_name: 'invoice-001.pdf',
          mime_type: 'application/pdf',
          file_size: 245899,
          file_url: 'https://cdn.stanforteedge.com/uploads/requests/invoice-001.pdf'
        }
      }
    }
  })
  create(@Req() req: any, @Body() dto: AttachFileDto) {
    return this.filesService.attach(req.user?.id, dto);
  }

  @Post('attach')
  @Permissions('requests.create')
  @ApiOperation({ summary: 'Alias endpoint for creating file asset record' })
  attach(@Req() req: any, @Body() dto: AttachFileDto) {
    return this.filesService.attach(req.user?.id, dto);
  }
}
