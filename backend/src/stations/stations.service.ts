import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station, Barrel } from '../entities';
import { StationName } from '../common/enums';
import { BarrelsService } from '../barrels/barrels.service';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    private barrelsService: BarrelsService,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationRepository.find({
      order: { sequence: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Station> {
    const station = await this.stationRepository.findOne({
      where: { id },
    });
    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return station;
  }

  async findByName(name: StationName): Promise<Station> {
    const station = await this.stationRepository.findOne({
      where: { name },
    });
    if (!station) {
      throw new NotFoundException(`Station with name ${name} not found`);
    }
    return station;
  }

  async getStationQueue(id: string): Promise<Barrel[]> {
    const station = await this.findOne(id);
    return this.barrelsService.findByStation(station.name);
  }

  async initializeStations(): Promise<Station[]> {
    const stations = [
      { name: StationName.DRILLING, sequence: 1, description: 'Barrel blank drilling & registration' },
      { name: StationName.REAMING, sequence: 2, description: 'Precision ream bore' },
      { name: StationName.RIFLING, sequence: 3, description: 'Button / cut / hammer-forged rifling' },
      { name: StationName.HEAT_TREAT, sequence: 4, description: 'External vendor heat treatment' },
      { name: StationName.LAPPING, sequence: 5, description: 'Hand/lap machine surface finish' },
      { name: StationName.HONING, sequence: 6, description: 'Optional honing and polishing' },
      { name: StationName.CHAMBERING, sequence: 7, description: 'CNC lathe chambering & threading' },
      { name: StationName.INSPECTION, sequence: 8, description: 'Bore scope, air-gauging, headspace QC' },
      { name: StationName.FINISHING, sequence: 9, description: 'Nitride, Cerakote, etc.' },
      { name: StationName.FINAL_QC, sequence: 10, description: 'Final QC & inventory preparation' },
    ];

    const createdStations: Station[] = [];
    
    for (const stationData of stations) {
      let station = await this.stationRepository.findOne({
        where: { name: stationData.name },
      });
      
      if (!station) {
        station = this.stationRepository.create(stationData);
        station = await this.stationRepository.save(station);
      }
      
      createdStations.push(station);
    }

    return createdStations;
  }
}
