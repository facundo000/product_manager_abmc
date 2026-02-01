import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class QrRefreshService {
  private readonly logger = new Logger(QrRefreshService.name);

  constructor(private paymentService: PaymentService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async refreshExpiredQRs(): Promise<void> {
    try {
      this.logger.log('Starting automatic QR refresh task...');
      const result = await this.paymentService.refreshExpiredQRs();
      this.logger.log(
        `QR refresh completed. Refreshed: ${result.refreshed}, Failed: ${result.failed}`,
      );
    } catch (error) {
      this.logger.error('Error during QR refresh task:', error);
    }
  }
}
