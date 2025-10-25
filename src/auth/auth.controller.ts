import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
