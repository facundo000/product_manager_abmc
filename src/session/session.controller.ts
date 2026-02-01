import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ValidRoles } from '../auth/interface/valid-roles';
import { User } from '../user/entities/user.entity';
import { SessionService } from './session.service';
import { SessionLog } from './entities/session-log.entity';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('me/active')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  @ApiResponse({
    status: 200,
    description: 'Get active session for current user',
    type: SessionLog,
  })
  async getActiveSession(
    @GetUser() user: User,
  ): Promise<SessionLog | null> {
    return await this.sessionService.getActiveSessionByUser(user.id);
  }

  @Get('me/history')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  @ApiResponse({
    status: 200,
    description: 'Get session history for current user',
  })
  async getSessionHistory(
    @GetUser() user: User,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: SessionLog[]; total: number }> {
    return await this.sessionService.getUserSessionHistory(user.id, limit);
  }

  @Get('all/active')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Get all active sessions (admin only)',
    type: [SessionLog],
  })
  async getAllActiveSessions(): Promise<SessionLog[]> {
    return await this.sessionService.getAllActiveSessions();
  }

  @Get('user/:userId/history')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.ADMIN)
  @ApiResponse({
    status: 200,
    description: 'Get session history for specific user (admin only)',
  })
  async getUserSessionHistoryAdmin(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
  ): Promise<{ data: SessionLog[]; total: number }> {
    return await this.sessionService.getUserSessionHistory(userId, limit);
  }
}
