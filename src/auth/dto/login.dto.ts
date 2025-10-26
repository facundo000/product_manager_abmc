import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
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
    }
