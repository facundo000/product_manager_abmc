import { createParamDecorator, ExecutionContext, InternalServerErrorException, SetMetadata } from '@nestjs/common';

export const GetUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        // Si no hay usuario, retornar null (útil para guards opcionales)
        if(!user)
            return null;

        return (!data) ? user : user[data];
    }
)
