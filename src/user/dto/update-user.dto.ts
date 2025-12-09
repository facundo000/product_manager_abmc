import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ValidRoles } from '../../auth/interface/valid-roles';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    full_name?: string;

    @IsEnum(ValidRoles)
    @IsOptional()
    role?: ValidRoles;
}
