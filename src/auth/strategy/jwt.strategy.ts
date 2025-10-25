import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { User } from "src/user/entities/user.entity";
import { JwtPayload } from "../interface/jwt-payload.interface";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        @InjectRepository( User )
        private readonly userRepository: Repository<User>,

        private readonly confService: ConfigService
    ){
        // Aseguramos que JWT_SECRET nunca sea undefined
        const jwtSecret = confService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET no está definido en las variables de entorno');
        }
        super({
            secretOrKey: jwtSecret, // Ahora TypeScript sabe que es string
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
        });
    }

    async validate( payload: JwtPayload ): Promise<User> {
        
        const { id } = payload;

        const user = await this.userRepository.findOneBy({ id });

        if ( !user ) 
            throw new UnauthorizedException('Token not valid')
            
        if ( !user.is_active ) 
            throw new UnauthorizedException('User is inactive, talk with an admin');
        

        return user;
    }
}

