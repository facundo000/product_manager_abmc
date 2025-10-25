import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[]= this.reflector.get<string[]>('META_ROLES', context.getHandler())

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if(!user)
      throw new BadRequestException('User not found (request)');
    if(validRoles.length === 0) return false;

    if(validRoles.includes(user.role)) return true;

    throw new ForbiddenException(`User role ${user.role} not allowed for this action`)
  }
}
