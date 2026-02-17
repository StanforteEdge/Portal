import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FormsService } from './forms.service';

@Controller('forms')
@ApiTags('Forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  list() {
    return this.formsService.list();
  }

  @Get(':id')
  getForm(@Param('id') id: string) {
    return this.formsService.getFormById(id);
  }
}
