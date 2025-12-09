import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interface/valid-roles';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive statistics' })
  // @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async getStats() {
    return await this.dashboardService.getStats();
  }
}
