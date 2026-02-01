import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionService } from '../session/session.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SessionListener {
  private readonly logger = new Logger(SessionListener.name);

  constructor(private sessionService: SessionService) {}

  @OnEvent('user.login')
  async handleUserLogin(payload: {
    user: User;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.sessionService.createSessionLog(
        payload.user,
        payload.ipAddress,
        payload.userAgent,
      );
      this.logger.log(`Session created for user ${payload.user.email}`);
    } catch (error) {
      this.logger.error(`Error creating session log: ${error.message}`);
    }
  }

  @OnEvent('user.logout')
  async handleUserLogout(payload: {
    sessionLogId: string;
    userId: string;
  }): Promise<void> {
    try {
      await this.sessionService.updateSessionLogLogout(payload.sessionLogId);
      this.logger.log(`Session ended for user ${payload.userId}`);
    } catch (error) {
      this.logger.error(`Error updating session log: ${error.message}`);
    }
  }
}
