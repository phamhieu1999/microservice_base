import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'login_attempts' })
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ default: false })
  success: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

