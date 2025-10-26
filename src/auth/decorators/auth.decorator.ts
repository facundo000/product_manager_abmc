import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../interface/valid-roles';
import { AuthGuard } from '@nestjs/passport';
import { RoleProtected } from './role-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';


export const Auth = (...roles: ValidRoles[]) => {
    if (roles.length === 0) {
        return applyDecorators(
            UseGuards(AuthGuard('jwt'))
        );
    }
    return applyDecorators(
        RoleProtected(...roles),
        UseGuards(AuthGuard('jwt'), UserRoleGuard)
    )
}
