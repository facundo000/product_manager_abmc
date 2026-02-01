import { Controller, Post, Body, Get, UseGuards, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Auth } from './decorators/auth.decorator';
import { RawHeaders } from './decorators/raw-headers.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { OptionalAuthGuard } from './guards/user-role/optional-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ValidRoles } from './interface/valid-roles';
import { SessionService } from '../session/session.service';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user in the system with the provided credentials. The password is securely stored using bcrypt.'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User data to be registered'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered. Returns user data and a JWT token.',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          username: 'johndoe',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          role: 'viewer',
          is_active: true,
          created_at: '2024-01-25T12:00:00.000Z',
          last_login: null
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid data or the username/email already exists',
    schema: {
      example: {
        statusCode: 400,
        message: 'The username or email already exists',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal Server Error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Error registering user',
        error: 'Internal Server Error'
      }
    }
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(
    @Body() loginDto: LoginDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    return await this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.ADMIN, ValidRoles.EMPLOYEE, ValidRoles.VIEWER)
  async logoutUser(
    @Body() body: { sessionLogId: string },
    @GetUser() user: User,
  ) {
    await this.authService.logout(body.sessionLogId, user.id);
    return { message: 'Logout successful' };
  }

  @Get('check-status')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({
    summary: 'Check authentication status',
    description: 'Returns authentication status. If user is not authenticated, returns role "user". If authenticated, returns user data with role and a new token.'
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication status retrieved successfully',
    schema: {
      oneOf: [
        {
          description: 'Not authenticated',
          example: {
            role: 'user',
            authenticated: false
          }
        },
        {
          description: 'Authenticated user',
          example: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            username: 'johndoe',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            role: 'admin',
            is_active: true,
            created_at: '2024-01-25T12:00:00.000Z',
            last_login: '2024-01-26T10:30:00.000Z',
            authenticated: true,
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      ]
    }
  })
  checkAuthStatus(
    @GetUser() user: User | null    
  ){
    return this.authService.checkAuthStatus( user )
  }

  @Get('private/users')
  @Auth(ValidRoles.ADMIN)
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('username') username: string,

    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      message: 'Acceso solo para administradores',
      user,
      username,
      rawHeaders,
    };
  }
}
