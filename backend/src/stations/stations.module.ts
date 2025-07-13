import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';
import { Station } from '../entities';
import { BarrelsModule } from '../barrels/barrels.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Station]),
    forwardRef(() => BarrelsModule),
  ],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
