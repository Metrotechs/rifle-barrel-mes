import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarrelsModule } from './barrels/barrels.module';
import { StationsModule } from './stations/stations.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth';
import { validate } from './config';
import { Barrel, Station, OperationLog, InventorySnapshot } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'rifle_barrel_mes'),
        entities: [Barrel, Station, OperationLog, InventorySnapshot],
        // IMPORTANT: In production, use migrations instead of synchronize
        synchronize: configService.get('NODE_ENV') === 'development',
        migrationsRun: configService.get('NODE_ENV') === 'production',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: configService.get('NODE_ENV') === 'development',
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),
    AuthModule,
    BarrelsModule,
    StationsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
