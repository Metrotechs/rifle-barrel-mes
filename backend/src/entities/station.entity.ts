import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { StationName } from '../common/enums';
import { OperationLog } from './operation-log.entity';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: StationName,
    unique: true,
  })
  name: StationName;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => OperationLog, (log: OperationLog) => log.station)
  operationLogs: OperationLog[];
}
