import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
  imports: [NotificationsModule, MailModule],
  controllers: [FinanceController],
  providers: [FinanceService]
})
export class FinanceModule {}
