import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findAll(filters?: {
    includeInactive?: boolean;
    search?: string;
    role?: string;
  }): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    // Filter inactive users by default
    if (!filters?.includeInactive) {
      query.andWhere('user.is_active = :isActive', { isActive: true });
    }

    // Search by username, email, or full_name
    if (filters?.search) {
      query.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.full_name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Filter by role
    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    query.orderBy('user.created_at', 'DESC');

    return await query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUserId: string, isAdmin: boolean): Promise<User> {
    // Check if user is updating their own account or is admin
    if (id !== requestingUserId && !isAdmin) {
      throw new ForbiddenException('You can only update your own account');
    }

    const user = await this.findOne(id);

    // Check for duplicate username or email if being updated
    if (updateUserDto.username || updateUserDto.email) {
      const duplicateCheck = await this.userRepository.findOne({
        where: [
          updateUserDto.username ? { username: updateUserDto.username } : {},
          updateUserDto.email ? { email: updateUserDto.email } : {},
        ],
      });

      if (duplicateCheck && duplicateCheck.id !== id) {
        if (duplicateCheck.username === updateUserDto.username) {
          throw new BadRequestException(`User with username ${updateUserDto.username} already exists`);
        }
        if (duplicateCheck.email === updateUserDto.email) {
          throw new BadRequestException(`User with email ${updateUserDto.email} already exists`);
        }
      }
    }

    // Hash password if being updated
    if (updateUserDto.password) {
      updateUserDto['password_hash'] = await bcrypt.hash(updateUserDto.password, 10);
      delete updateUserDto.password;
    }

    // Only admin can change role
    if (updateUserDto.role && !isAdmin) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string, requestingUserId: string, isAdmin: boolean): Promise<User> {
    // Check if user is deleting their own account or is admin
    if (id !== requestingUserId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const user = await this.findOne(id);

    // Soft delete: set is_active to false
    user.is_active = false;
    return await this.userRepository.save(user);
  }

  async restore(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.is_active) {
      throw new BadRequestException('User is already active');
    }

    user.is_active = true;
    return await this.userRepository.save(user);
  }
}
