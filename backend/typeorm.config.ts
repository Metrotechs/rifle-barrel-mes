import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Barrel, Station, OperationLog, InventorySnapshot } from './src/entities';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'rifle_barrel_mes',
  entities: [Barrel, Station, OperationLog, InventorySnapshot],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
