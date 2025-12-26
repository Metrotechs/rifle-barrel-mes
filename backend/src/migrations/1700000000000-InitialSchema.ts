import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stations table
    await queryRunner.createTable(
      new Table({
        name: 'stations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'sequence', type: 'integer' },
          { name: 'status', type: 'varchar', length: '50', default: "'available'" },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Create barrels table
    await queryRunner.createTable(
      new Table({
        name: 'barrels',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'serial_number', type: 'varchar', length: '100', isUnique: true },
          { name: 'caliber', type: 'varchar', length: '50' },
          { name: 'length_inches', type: 'decimal', precision: 5, scale: 2 },
          { name: 'material', type: 'varchar', length: '100', isNullable: true },
          { name: 'twist_rate', type: 'varchar', length: '50', isNullable: true },
          { name: 'contour', type: 'varchar', length: '100', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'DRILLING_PENDING'" },
          { name: 'priority', type: 'varchar', length: '20', default: "'Medium'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'current_station_id', type: 'uuid', isNullable: true },
          { name: 'current_operator_id', type: 'varchar', isNullable: true },
          { name: 'current_operator_name', type: 'varchar', isNullable: true },
          { name: 'current_operation_start_time', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['current_station_id'],
            referencedTableName: 'stations',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create operation_logs table
    await queryRunner.createTable(
      new Table({
        name: 'operation_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'barrel_id', type: 'uuid' },
          { name: 'station_id', type: 'uuid' },
          { name: 'operator_id', type: 'varchar', isNullable: true },
          { name: 'operator_name', type: 'varchar', isNullable: true },
          { name: 'operation_type', type: 'varchar', length: '100' },
          { name: 'start_time', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'end_time', type: 'timestamp', isNullable: true },
          { name: 'duration_minutes', type: 'integer', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'in_progress'" },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        foreignKeys: [
          {
            columnNames: ['barrel_id'],
            referencedTableName: 'barrels',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['station_id'],
            referencedTableName: 'stations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create inventory_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'timestamp', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'total_barrels', type: 'integer', default: 0 },
          { name: 'wip_count', type: 'integer', default: 0 },
          { name: 'completed_count', type: 'integer', default: 0 },
          { name: 'by_station', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'barrels',
      new TableIndex({
        name: 'IDX_barrels_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'barrels',
      new TableIndex({
        name: 'IDX_barrels_current_station',
        columnNames: ['current_station_id'],
      }),
    );

    await queryRunner.createIndex(
      'operation_logs',
      new TableIndex({
        name: 'IDX_operation_logs_barrel',
        columnNames: ['barrel_id'],
      }),
    );

    await queryRunner.createIndex(
      'operation_logs',
      new TableIndex({
        name: 'IDX_operation_logs_start_time',
        columnNames: ['start_time'],
      }),
    );

    // Seed default stations
    await queryRunner.query(`
      INSERT INTO stations (name, description, sequence) VALUES
      ('Drilling', 'Deep hole drilling operation', 1),
      ('Reaming', 'Reaming to final bore diameter', 2),
      ('Rifling', 'Cut or button rifling', 3),
      ('Lapping', 'Bore lapping and polishing', 4),
      ('Chambering', 'Chamber cutting', 5),
      ('Threading', 'Muzzle and receiver threading', 6),
      ('Finishing', 'Final finishing and coating', 7),
      ('QC', 'Quality control and inspection', 8)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('operation_logs', 'IDX_operation_logs_start_time');
    await queryRunner.dropIndex('operation_logs', 'IDX_operation_logs_barrel');
    await queryRunner.dropIndex('barrels', 'IDX_barrels_current_station');
    await queryRunner.dropIndex('barrels', 'IDX_barrels_status');

    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.dropTable('inventory_snapshots', true);
    await queryRunner.dropTable('operation_logs', true);
    await queryRunner.dropTable('barrels', true);
    await queryRunner.dropTable('stations', true);
  }
}
