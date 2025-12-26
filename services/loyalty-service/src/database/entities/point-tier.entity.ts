import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'point_tiers' })
export class PointTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // BRONZE, SILVER, GOLD, PLATINUM

  @Column({ type: 'int' })
  minPoints: number;

  @Column({ type: 'int' })
  maxPoints: number;

  @Column({ type: 'text', nullable: true })
  benefits?: string;
}
