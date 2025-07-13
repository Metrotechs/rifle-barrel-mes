import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarrelsController } from './barrels.controller';
import { BarrelsService } from './barrels.service';
import { Barrel, OperationLog, Station } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Barrel, OperationLog, Station])],
  controllers: [BarrelsController],
  providers: [BarrelsService],
  exports: [BarrelsService],
})
export class BarrelsModule {}
