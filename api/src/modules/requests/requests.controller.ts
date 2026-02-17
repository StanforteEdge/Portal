import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { SubmitRequestDto } from './dto/submit-request.dto';
import { ActionRequestDto } from './dto/action-request.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Permissions } from '../../common/auth/permissions.decorator';
import { PermissionsGuard } from '../../common/auth/permissions.guard';

@Controller('requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Requests')
@ApiBearerAuth('bearer')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('groups')
  @Permissions('requests.view')
  listGroups() {
    return this.requestsService.listGroups();
  }

  @Post('groups')
  @Permissions('requests.manage')
  createGroup(@Body() dto: CreateGroupDto) {
    return this.requestsService.createGroup(dto);
  }

  @Post('groups/:id')
  @Permissions('requests.manage')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.requestsService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @Permissions('requests.manage')
  deleteGroup(@Param('id') id: string) {
    return this.requestsService.deleteGroup(id);
  }

  @Get('types')
  @Permissions('requests.view')
  listTypes(@Query('group_id') groupId?: string, @Query('include_inactive') includeInactive?: string) {
    return this.requestsService.listTypes(groupId, includeInactive === 'true');
  }

  @Get('types/:id')
  @Permissions('requests.view')
  getType(@Param('id') id: string) {
    return this.requestsService.getType(id);
  }

  @Post('types')
  @Permissions('requests.manage')
  createType(@Body() dto: CreateTypeDto) {
    return this.requestsService.createType(dto);
  }

  @Post('types/:id')
  @Permissions('requests.manage')
  updateType(@Param('id') id: string, @Body() dto: UpdateTypeDto) {
    return this.requestsService.updateType(id, dto);
  }

  @Delete('types/:id')
  @Permissions('requests.manage')
  deleteType(@Param('id') id: string) {
    return this.requestsService.deleteType(id);
  }

  @Post()
  @Permissions('requests.create')
  createRequest(@Req() req: any, @Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(req.user?.id, dto);
  }

  @Post(':id/submit')
  @Permissions('requests.create')
  submitRequest(@Req() req: any, @Param('id') id: string, @Body() dto: SubmitRequestDto) {
    return this.requestsService.submitRequest(id, req.user?.id, dto);
  }

  @Post(':id/approve')
  @Permissions('requests.approve')
  approveRequest(@Req() req: any, @Param('id') id: string, @Body() dto: ActionRequestDto) {
    return this.requestsService.approveRequest(id, req.user?.id, dto);
  }

  @Post(':id/reject')
  @Permissions('requests.approve')
  rejectRequest(@Req() req: any, @Param('id') id: string, @Body() dto: ActionRequestDto) {
    return this.requestsService.rejectRequest(id, req.user?.id, dto);
  }

  @Get()
  @Permissions('requests.view')
  listRequests(@Req() req: any, @Query() query: Record<string, any>) {
    return this.requestsService.listRequests(query, req.user?.id);
  }

  @Get('pending-approvals')
  @Permissions('requests.approve')
  getPendingApprovals(@Req() req: any, @Query() query: Record<string, any>) {
    return this.requestsService.getPendingApprovals(req.user?.id, query);
  }

  @Get(':id')
  @Permissions('requests.view')
  getRequest(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.getRequest(id, req.user?.id);
  }

  @Get(':id/actions')
  @Permissions('requests.view')
  getActions(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.getActions(id, req.user?.id);
  }

  @Get(':id/history')
  @Permissions('requests.view')
  getApprovalHistory(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.getApprovalHistory(id, req.user?.id);
  }


  @Post('generate-pdf')
  @Permissions('requests.view')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '1001', description: 'Request bigint ID as string' }
      },
      required: ['id']
    }
  })
  generatePdf(@Req() req: any, @Body('id') id: string) {
    return this.requestsService.generatePdf(id, req.user?.id);
  }

  @Post('generate-pv')
  @Permissions('requests.view')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '1001', description: 'Request bigint ID as string' }
      },
      required: ['id']
    }
  })
  generatePaymentVoucher(@Req() req: any, @Body('id') id: string) {
    return this.requestsService.generatePaymentVoucher(id, req.user?.id);
  }

  @Post(':id')
  @Permissions('requests.manage')
  updateRequest(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRequestDto) {
    return this.requestsService.updateRequest(id, req.user?.id, dto);
  }

  @Delete(':id')
  @Permissions('requests.manage')
  deleteRequest(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.deleteRequest(id, req.user?.id);
  }

  @Post(':id/retire')
  @Permissions('requests.retire')
  retire(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.retire(id, req.user?.id);
  }

  @Post(':id/verify-retirement')
  @Permissions('requests.approve')
  verifyRetirement(@Req() req: any, @Param('id') id: string) {
    return this.requestsService.verifyRetirement(id, req.user?.id);
  }
}
