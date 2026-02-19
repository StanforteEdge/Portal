import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { FormsModule } from '../forms/forms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [WorkflowModule, FormsModule, NotificationsModule, MailModule],
  controllers: [RequestsController],
  providers: [RequestsService]
})
export class RequestsModule {}
