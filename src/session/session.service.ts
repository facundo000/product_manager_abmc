import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SessionLog } from './entities/session-log.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionLog)
    private sessionLogRepository: Repository<SessionLog>,
  ) {}

  async createSessionLog(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SessionLog> {
    const sessionLog = this.sessionLogRepository.create({
      user,
      loginAt: new Date(),
      ipAddress,
      userAgent,
    });

    return await this.sessionLogRepository.save(sessionLog);
  }

  async updateSessionLogLogout(sessionLogId: string): Promise<SessionLog> {
    const sessionLog = await this.sessionLogRepository.findOne({
      where: { id: sessionLogId },
    });

    if (!sessionLog) {
      throw new NotFoundException(
        `Session log with id ${sessionLogId} not found`,
      );
    }

    sessionLog.logoutAt = new Date();
    return await this.sessionLogRepository.save(sessionLog);
  }

  async getActiveSessionByUser(userId: string): Promise<SessionLog | null> {
    return await this.sessionLogRepository.findOne({
      where: {
        user: { id: userId },
        logoutAt: IsNull(),
      },
      relations: ['user'],
    });
  }

  async getUserSessionHistory(
    userId: string,
    limit: number = 10,
  ): Promise<{ data: SessionLog[]; total: number }> {
    const [data, total] = await this.sessionLogRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { loginAt: 'DESC' },
      take: limit,
    });

    return { data, total };
  }

  async getAllActiveSessions(): Promise<SessionLog[]> {
    return await this.sessionLogRepository.find({
      where: { logoutAt: IsNull() },
      relations: ['user'],
      order: { loginAt: 'DESC' },
    });
  }
}
