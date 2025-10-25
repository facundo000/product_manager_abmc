import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
   PassportModule.register({ defaultStrategy: 'jwt' }),
   JwtModule.registerAsync({
     imports: [ConfigModule],
     inject: [ConfigService],
     useFactory: (configService: ConfigService) => {
       return {
         secret: configService.get('JWT_SECRET'),
         signOptions: {
           expiresIn: '1h'
         }
       }
     }
   })
 ],
 exports: [JwtStrategy, TypeOrmModule, PassportModule, JwtModule ]
})
export class AuthModule {}
