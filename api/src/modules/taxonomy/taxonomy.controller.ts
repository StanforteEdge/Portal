import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { SyncTaxonomyTermsDto } from './dto/sync-taxonomy-terms.dto';
import { UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
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

  @Get('taxonomies')
  @Permissions('settings.manage')
  listTaxonomies(@Query() query: Record<string, any>) {
    return this.taxonomyService.listTaxonomies(query);
  }

  @Post('taxonomies')
  @Permissions('settings.manage')
  createTaxonomy(@Body() dto: CreateTaxonomyDto) {
    return this.taxonomyService.createTaxonomy(dto);
  }

  @Post('taxonomies/:id')
  @Permissions('settings.manage')
  updateTaxonomy(@Param('id') id: string, @Body() dto: UpdateTaxonomyDto) {
    return this.taxonomyService.updateTaxonomy(id, dto);
  }

  @Post('taxonomies/:id/terms/sync')
  @Permissions('settings.manage')
  syncTaxonomyTerms(@Param('id') id: string, @Body() dto: SyncTaxonomyTermsDto) {
    return this.taxonomyService.syncTerms(id, dto);
  }

  @Post('form-fields/:fieldId/options')
  @Permissions('settings.manage')
  updateFieldOptions(@Param('fieldId') fieldId: string, @Body() dto: UpdateFieldOptionsDto) {
    return this.taxonomyService.updateFieldOptions(fieldId, dto);
  }
}
