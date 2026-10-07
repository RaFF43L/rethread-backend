import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// TypeORM persistence model for users. Lives in infra so the domain entity
// stays free of ORM decorators; mapping is manual (user.mapper).
@Entity('users')
export class UserSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ name: 'provider_id', unique: true })
  providerId!: string;

  @Column({ name: 'picture_url', type: 'varchar', nullable: true })
  pictureUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
