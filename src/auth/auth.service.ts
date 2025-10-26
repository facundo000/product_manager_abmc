import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../user/interfaces/user-role';
import { JwtPayload } from './interface/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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
        role: role || UserRole.VIEWER,
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

  async login(loginDto: LoginDto){
      const {email, password } = loginDto;
      const user = await this.userRepository.findOne({
        where: {email},
        select: {email: true, password_hash: true, id:true}
      });

      if(!user){
        throw new UnauthorizedException('Invalid credentials - Username')
      }

      if(!bcrypt.compareSync(password, user.password_hash)){
        throw new UnauthorizedException('Invalid credentials - password')
      }

       return {
        user: user,
        token: this.getJwtToken({ id: user.id, username: user.username })
      }
    }

  private getJwtToken(payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
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
