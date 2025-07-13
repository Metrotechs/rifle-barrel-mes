import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_snapshots')
export class InventorySnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'barrel_type', length: 100 })
  barrelType: string;

  @Column({ type: 'int' })
  caliber: string;

  @Column({ length: 20 })
  twist: string;

  @Column({ name: 'length_in', type: 'int' })
  lengthIn: number;

  @Column({ name: 'qty_available', type: 'int', default: 0 })
  qtyAvailable: number;

  @Column({ name: 'last_synced', type: 'timestamp' })
  lastSynced: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
