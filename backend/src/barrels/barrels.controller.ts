import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BarrelsService } from './barrels.service';
import { CreateBarrelDto, StartOperationDto, CompleteOperationDto } from './dto/barrel.dto';
import { Barrel } from '../entities';
import { StationName } from '../common/enums';

@Controller('barrels')
export class BarrelsController {
  constructor(private readonly barrelsService: BarrelsService) {}

  @Post()
  create(@Body() createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    return this.barrelsService.create(createBarrelDto);
  }

  @Get()
  findAll(): Promise<Barrel[]> {
    return this.barrelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.findOne(id);
  }

  @Put(':id/start')
  startOperation(
    @Param('id') id: string,
    @Body() startOperationDto: StartOperationDto,
  ): Promise<Barrel> {
    return this.barrelsService.startOperation(id, startOperationDto);
  }

  @Put(':id/pause')
  pauseOperation(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.pauseOperation(id);
  }

  @Put(':id/resume')
  resumeOperation(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.resumeOperation(id);
  }

  @Put(':id/complete')
  completeOperation(
    @Param('id') id: string,
    @Body() completeOperationDto: CompleteOperationDto,
  ): Promise<Barrel> {
    return this.barrelsService.completeOperation(id, completeOperationDto);
  }
}
