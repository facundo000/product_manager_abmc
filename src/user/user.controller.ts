import { Controller, Get, Body, Patch, Param, Delete, Query, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidRoles } from '../auth/interface/valid-roles';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users with optional filters (Admin only)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean, description: 'Include inactive users' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by username, email, or full name' })
  @ApiQuery({ name: 'role', required: false, enum: ValidRoles, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'Returns list of users' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  async findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return await this.userService.findAll({
      includeInactive: includeInactive === 'true',
      search,
      role,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin or own account)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own account' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async findOne(@Param('id') id: string, @GetUser() currentUser: User) {
    // Users can only view their own account unless they're admin
    if (id !== currentUser.id && currentUser.role !== ValidRoles.ADMIN) {
      throw new Error('You can only view your own account');
    }
    return await this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user (Admin or own account)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own account' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or duplicate user' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    const isAdmin = currentUser.role === ValidRoles.ADMIN;
    return await this.userService.update(id, updateUserDto, currentUser.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user (Admin or own account)' })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own account' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async remove(@Param('id') id: string, @GetUser() currentUser: User) {
    const isAdmin = currentUser.role === ValidRoles.ADMIN;
    return await this.userService.remove(id, currentUser.id, isAdmin);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft deleted user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 400, description: 'User is already active' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  async restore(@Param('id') id: string) {
    return await this.userService.restore(id);
  }
}
