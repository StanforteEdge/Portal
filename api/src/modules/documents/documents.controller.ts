import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Documents')
@ApiBearerAuth('bearer')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Permissions('requests.view')
  list(@Query() query: Record<string, any>) {
    return this.documentsService.list(query);
  }

  @Get(':id')
  @Permissions('requests.view')
  get(@Param('id') id: string) {
    return this.documentsService.get(id);
  }

  @Post()
  @Permissions('requests.create')
  create(@Req() req: any, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto, req.user?.id);
  }

  @Post(':id/status')
  @Permissions('requests.manage')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentsService.updateStatus(id, dto, req.user?.id);
  }
}
