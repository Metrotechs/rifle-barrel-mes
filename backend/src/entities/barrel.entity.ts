import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BarrelStatus } from '../common/enums';
import { OperationLog } from './operation-log.entity';

@Entity('barrels')
export class Barrel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  caliber: string;

  @Column({ name: 'length_in', type: 'int' })
  lengthIn: number;

  @Column({ length: 20 })
  twist: string;

  @Column({
    type: 'enum',
    enum: BarrelStatus,
    default: BarrelStatus.DRILLING_PENDING,
  })
  status: BarrelStatus;

  @Column({ name: 'serial_number', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ name: 'barcode', length: 100, nullable: true })
  barcode?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OperationLog, (log: OperationLog) => log.barrel, { cascade: true })
  operationLogs: OperationLog[];
}
