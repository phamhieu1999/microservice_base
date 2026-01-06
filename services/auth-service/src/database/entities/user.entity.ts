import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'USER' })
  role: 'USER' | 'ADMIN';

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  emailVerificationExpires?: Date;

  @Column({ default: false })
  isLocked: boolean; // Account lockout

  @Column({ nullable: true })
  lockedUntil?: Date | null; // Lock expiry time

  @Column({ nullable: true })
  oauthProvider?: string; // 'google', 'facebook', etc.

  @Column({ nullable: true })
  oauthId?: string; // OAuth provider user ID

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


