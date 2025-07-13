import { Controller, Get, Param } from '@nestjs/common';
import { StationsService } from './stations.service';
import { Station, Barrel } from '../entities';

@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  findAll(): Promise<Station[]> {
    return this.stationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Station> {
    return this.stationsService.findOne(id);
  }

  @Get(':id/queue')
  getQueue(@Param('id') id: string): Promise<Barrel[]> {
    return this.stationsService.getStationQueue(id);
  }

  @Get('initialize')
  initializeStations(): Promise<Station[]> {
    return this.stationsService.initializeStations();
  }
}
