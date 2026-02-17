import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { FormsModule } from '../forms/forms.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [WorkflowModule, FormsModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService]
})
export class RequestsModule {}
