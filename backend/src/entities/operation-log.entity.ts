import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExceptionCode } from '../common/enums';
import { Barrel } from './barrel.entity';
import { Station } from './station.entity';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'barrel_id', type: 'uuid' })
  barrelId: string;

  @Column({ name: 'station_id', type: 'uuid' })
  stationId: string;

  @Column({ name: 'operator_id', length: 100, nullable: true })
  operatorId?: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'paused_at', type: 'timestamp', nullable: true })
  pausedAt?: Date;

  @Column({ name: 'resumed_at', type: 'timestamp', nullable: true })
  resumedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    name: 'exception_code',
    type: 'enum',
    enum: ExceptionCode,
    nullable: true,
  })
  exceptionCode?: ExceptionCode;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Barrel, (barrel) => barrel.operationLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barrel_id' })
  barrel: Barrel;

  @ManyToOne(() => Station, (station) => station.operationLogs)
  @JoinColumn({ name: 'station_id' })
  station: Station;
}
