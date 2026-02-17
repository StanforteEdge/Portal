import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { UpdateFieldOptionsDto } from './dto/update-field-options.dto';
import { TaxonomyService } from './taxonomy.service';

@Controller('taxonomy')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Taxonomy')
@ApiBearerAuth('bearer')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  @Permissions('requests.view')
  list(@Query() query: Record<string, any>) {
    return this.taxonomyService.list(query);
  }

  @Post('form-fields/:fieldId/options')
  @Permissions('settings.manage')
  updateFieldOptions(@Param('fieldId') fieldId: string, @Body() dto: UpdateFieldOptionsDto) {
    return this.taxonomyService.updateFieldOptions(fieldId, dto);
  }
}
