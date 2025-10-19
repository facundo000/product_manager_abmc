import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../interfaces/user-role";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 50 })
    username: string;
  
    @Column({ unique: true, length: 100 })
    email: string;
  
    @Column({ select: false })
    password_hash: string;
  
    @Column({ length: 100 })
    full_name: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.VIEWER,
    })
    role: UserRole;
  
    @Column({ default: true })
    is_active: boolean;
  
    @CreateDateColumn()
    created_at: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    last_login: Date;
}
