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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BarrelsService } from './barrels.service';
import { CreateBarrelDto, StartOperationDto, CompleteOperationDto } from './dto/barrel.dto';
import { Barrel } from '../entities';
import { StationName } from '../common/enums';

@ApiTags('barrels')
@Controller('barrels')
export class BarrelsController {
  constructor(private readonly barrelsService: BarrelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new barrel' })
  @ApiResponse({ status: 201, description: 'Barrel created successfully' })
  create(@Body() createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    return this.barrelsService.create(createBarrelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all barrels' })
  @ApiResponse({ status: 200, description: 'List of all barrels' })
  findAll(): Promise<Barrel[]> {
    return this.barrelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get barrel by ID' })
  @ApiResponse({ status: 200, description: 'Barrel details' })
  @ApiResponse({ status: 404, description: 'Barrel not found' })
  findOne(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.findOne(id);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start an operation on a barrel' })
  @ApiResponse({ status: 200, description: 'Operation started' })
  startOperation(
    @Param('id') id: string,
    @Body() startOperationDto: StartOperationDto,
  ): Promise<Barrel> {
    return this.barrelsService.startOperation(id, startOperationDto);
  }

  @Put(':id/pause')
  @ApiOperation({ summary: 'Pause current operation' })
  pauseOperation(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.pauseOperation(id);
  }

  @Put(':id/resume')
  @ApiOperation({ summary: 'Resume paused operation' })
  resumeOperation(@Param('id') id: string): Promise<Barrel> {
    return this.barrelsService.resumeOperation(id);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete current operation' })
  @ApiResponse({ status: 200, description: 'Operation completed, barrel moved to next station' })
  completeOperation(
    @Param('id') id: string,
    @Body() completeOperationDto: CompleteOperationDto,
  ): Promise<Barrel> {
    return this.barrelsService.completeOperation(id, completeOperationDto);
  }
}
