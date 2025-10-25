import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../user/interfaces/user-role';

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
}
