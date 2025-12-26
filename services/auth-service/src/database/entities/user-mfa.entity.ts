import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_mfa' })
export class UserMFA {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'varchar' })
  type: 'TOTP' | 'SMS'; // TOTP = Time-based OTP (Google Authenticator), SMS = SMS OTP

  @Column({ nullable: true })
  secret?: string; // TOTP secret (encrypted)

  @Column({ default: false })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

