import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../user/interfaces/user-role';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Email user',
    example: 'john.doe@example.com',
    maxLength: 100,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'Password user',
    example: 'SecureP@ssw0rd',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Full name user',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  full_name: string;

  @ApiProperty({
    description: 'Role user in the system',
    enum: UserRole,
    default: UserRole.VIEWER,
    example: UserRole.VIEWER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
