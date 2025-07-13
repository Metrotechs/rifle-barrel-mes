import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Barrel, OperationLog, Station } from '../entities';
import { BarrelStatus, StationName } from '../common/enums';
import { CreateBarrelDto, StartOperationDto, CompleteOperationDto } from './dto/barrel.dto';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelRepository: Repository<Barrel>,
    @InjectRepository(OperationLog)
    private operationLogRepository: Repository<OperationLog>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
  ) {}

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    const barrel = this.barrelRepository.create({
      ...createBarrelDto,
      status: BarrelStatus.DRILLING_PENDING,
    });
    return this.barrelRepository.save(barrel);
  }

  async findAll(): Promise<Barrel[]> {
    return this.barrelRepository.find({
      relations: ['operationLogs', 'operationLogs.station'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Barrel> {
    const barrel = await this.barrelRepository.findOne({
      where: { id },
      relations: ['operationLogs', 'operationLogs.station'],
    });
    if (!barrel) {
      throw new NotFoundException(`Barrel with ID ${id} not found`);
    }
    return barrel;
  }

  async findByStation(stationName: StationName): Promise<Barrel[]> {
    const pendingStatus = this.getStationPendingStatus(stationName);
    return this.barrelRepository.find({
      where: { status: pendingStatus },
      relations: ['operationLogs'],
      order: { createdAt: 'ASC' },
    });
  }

  async startOperation(barrelId: string, startOperationDto: StartOperationDto): Promise<Barrel> {
    const barrel = await this.findOne(barrelId);
    const station = await this.stationRepository.findOne({
      where: { id: startOperationDto.stationId },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${startOperationDto.stationId} not found`);
    }

    // Validate that barrel is in correct pending state for this station
    const expectedPendingStatus = this.getStationPendingStatus(station.name);
    if (barrel.status !== expectedPendingStatus) {
      throw new BadRequestException(
        `Barrel is in status ${barrel.status}, expected ${expectedPendingStatus} for station ${station.name}`,
      );
    }

    // Create operation log
    const operationLog = this.operationLogRepository.create({
      barrelId: barrel.id,
      stationId: station.id,
      operatorId: startOperationDto.operatorId,
      startedAt: new Date(),
      notes: startOperationDto.notes,
    });
    await this.operationLogRepository.save(operationLog);

    // Update barrel status to in progress
    const inProgressStatus = this.getStationInProgressStatus(station.name);
    barrel.status = inProgressStatus;
    await this.barrelRepository.save(barrel);

    return this.findOne(barrelId);
  }

  async pauseOperation(barrelId: string): Promise<Barrel> {
    const barrel = await this.findOne(barrelId);
    
    // Find the active operation log
    const activeLog = await this.operationLogRepository.findOne({
      where: {
        barrelId: barrel.id,
        completedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeLog) {
      throw new BadRequestException('No active operation found for this barrel');
    }

    activeLog.pausedAt = new Date();
    await this.operationLogRepository.save(activeLog);

    return barrel;
  }

  async resumeOperation(barrelId: string): Promise<Barrel> {
    const barrel = await this.findOne(barrelId);
    
    // Find the active operation log
    const activeLog = await this.operationLogRepository.findOne({
      where: {
        barrelId: barrel.id,
        completedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeLog) {
      throw new BadRequestException('No active operation found for this barrel');
    }

    activeLog.resumedAt = new Date();
    await this.operationLogRepository.save(activeLog);

    return barrel;
  }

  async completeOperation(barrelId: string, completeOperationDto: CompleteOperationDto): Promise<Barrel> {
    const barrel = await this.findOne(barrelId);
    
    // Find the active operation log
    const activeLog = await this.operationLogRepository.findOne({
      where: {
        barrelId: barrel.id,
        completedAt: IsNull(),
      },
      relations: ['station'],
      order: { createdAt: 'DESC' },
    });

    if (!activeLog || !activeLog.startedAt) {
      throw new BadRequestException('No active operation found for this barrel');
    }

    // Complete the operation log
    const completedAt = new Date();
    const durationSec = Math.floor((completedAt.getTime() - activeLog.startedAt.getTime()) / 1000);
    
    activeLog.completedAt = completedAt;
    activeLog.durationSec = durationSec;
    activeLog.notes = completeOperationDto.notes || activeLog.notes;
    activeLog.metadata = completeOperationDto.metadata;
    await this.operationLogRepository.save(activeLog);

    // Move barrel to next station
    const nextStatus = this.getNextStationStatus(activeLog.station.name);
    barrel.status = nextStatus;
    await this.barrelRepository.save(barrel);

    return this.findOne(barrelId);
  }

  private getStationPendingStatus(stationName: StationName): BarrelStatus {
    const statusMap: Record<StationName, BarrelStatus> = {
      [StationName.DRILLING]: BarrelStatus.DRILLING_PENDING,
      [StationName.REAMING]: BarrelStatus.REAMING_PENDING,
      [StationName.RIFLING]: BarrelStatus.RIFLING_PENDING,
      [StationName.HEAT_TREAT]: BarrelStatus.HEAT_TREAT_PENDING,
      [StationName.LAPPING]: BarrelStatus.LAPPING_PENDING,
      [StationName.HONING]: BarrelStatus.HONING_PENDING,
      [StationName.CHAMBERING]: BarrelStatus.CHAMBERING_PENDING,
      [StationName.INSPECTION]: BarrelStatus.INSPECTION_PENDING,
      [StationName.FINISHING]: BarrelStatus.FINISHING_PENDING,
      [StationName.FINAL_QC]: BarrelStatus.FINAL_QC_PENDING,
    };
    return statusMap[stationName];
  }

  private getStationInProgressStatus(stationName: StationName): BarrelStatus {
    const statusMap: Record<StationName, BarrelStatus> = {
      [StationName.DRILLING]: BarrelStatus.DRILLING_IN_PROGRESS,
      [StationName.REAMING]: BarrelStatus.REAMING_IN_PROGRESS,
      [StationName.RIFLING]: BarrelStatus.RIFLING_IN_PROGRESS,
      [StationName.HEAT_TREAT]: BarrelStatus.HEAT_TREAT_IN_PROGRESS,
      [StationName.LAPPING]: BarrelStatus.LAPPING_IN_PROGRESS,
      [StationName.HONING]: BarrelStatus.HONING_IN_PROGRESS,
      [StationName.CHAMBERING]: BarrelStatus.CHAMBERING_IN_PROGRESS,
      [StationName.INSPECTION]: BarrelStatus.INSPECTION_IN_PROGRESS,
      [StationName.FINISHING]: BarrelStatus.FINISHING_IN_PROGRESS,
      [StationName.FINAL_QC]: BarrelStatus.FINAL_QC_IN_PROGRESS,
    };
    return statusMap[stationName];
  }

  private getNextStationStatus(currentStationName: StationName): BarrelStatus {
    const nextStatusMap: Record<StationName, BarrelStatus> = {
      [StationName.DRILLING]: BarrelStatus.REAMING_PENDING,
      [StationName.REAMING]: BarrelStatus.RIFLING_PENDING,
      [StationName.RIFLING]: BarrelStatus.HEAT_TREAT_PENDING,
      [StationName.HEAT_TREAT]: BarrelStatus.LAPPING_PENDING,
      [StationName.LAPPING]: BarrelStatus.HONING_PENDING,
      [StationName.HONING]: BarrelStatus.CHAMBERING_PENDING,
      [StationName.CHAMBERING]: BarrelStatus.INSPECTION_PENDING,
      [StationName.INSPECTION]: BarrelStatus.FINISHING_PENDING,
      [StationName.FINISHING]: BarrelStatus.FINAL_QC_PENDING,
      [StationName.FINAL_QC]: BarrelStatus.READY_TO_SHIP,
    };
    return nextStatusMap[currentStationName];
  }
}
