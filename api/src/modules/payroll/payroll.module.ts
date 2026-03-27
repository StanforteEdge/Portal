import { Module } from '@nestjs/common';
import { MailModule } from '../../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [PayrollController],
  providers: [PayrollService]
})
export class PayrollModule {}
