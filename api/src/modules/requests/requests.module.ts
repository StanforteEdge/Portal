import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { FormsModule } from '../forms/forms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';
import { PdfModule } from '../../common/pdf/pdf.module';
import { DocumentGeneratorService } from '../../common/documents/document-generator.service';

@Module({
  imports: [WorkflowModule, FormsModule, NotificationsModule, MailModule, PdfModule],
  controllers: [RequestsController],
  providers: [RequestsService, DocumentGeneratorService],
  exports: [DocumentGeneratorService],
})
export class RequestsModule {}
