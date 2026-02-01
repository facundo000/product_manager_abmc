import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../user/interfaces/user-role';
import { JwtPayload } from './interface/jwt-payload.interface';
import { ValidRoles } from './interface/valid-roles';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { password, role, ...userData } = registerDto;
      
      const existingUser = await this.userRepository.findOne({
        where: [
          { username: userData.username },
          { email: userData.email },
        ],
      });

      if (existingUser) {
        throw new BadRequestException('El usuario o email ya existe');
      }


      const password_hash = await bcrypt.hash(password, 10);


      const user = this.userRepository.create({
        ...userData,
        password_hash,
        role:ValidRoles.VIEWER, 
      });

      await this.userRepository.save(user);

      const payload = { id: user.id, username: user.username };
      const token = this.jwtService.sign(payload);

      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error to register user');
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string){
      const {email, password } = loginDto;
      const user = await this.userRepository.findOne({
        where: {email},
        select: {email: true, password_hash: true, id:true, username: true, full_name: true, role: true, is_active: true}
      });

      if(!user){
        throw new UnauthorizedException('Invalid credentials - Username')
      }

      if(!bcrypt.compareSync(password, user.password_hash)){
        throw new UnauthorizedException('Invalid credentials - password')
      }

      // Emit login event for session tracking
      this.eventEmitter.emit('user.login', {
        user,
        ipAddress,
        userAgent,
      });

       return {
        user: user,
        token: this.getJwtToken({ id: user.id, username: user.username })
      }
    }

  private getJwtToken(payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
  }

  async logout(sessionLogId: string, userId: string): Promise<void> {
    // Emit logout event for session tracking
    this.eventEmitter.emit('user.logout', {
      sessionLogId,
      userId,
    });
  }

  async checkAuthStatus(user: User | null){
    // Si no hay usuario autenticado, devolver rol "user"
    if (!user) {
      return {
        role: 'user',
        authenticated: false
      };
    }

    // Si hay usuario autenticado, devolver sus datos y un nuevo token
    const { password_hash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      authenticated: true,
      token: this.getJwtToken({ id: user.id, username: user.username })
    };
  }
}
