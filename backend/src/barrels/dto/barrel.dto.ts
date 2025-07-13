import { IsString, IsInt, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { BarrelStatus } from '../../common/enums';

export class CreateBarrelDto {
  @IsString()
  caliber: string;

  @IsInt()
  lengthIn: number;

  @IsString()
  twist: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateBarrelStatusDto {
  @IsEnum(BarrelStatus)
  status: BarrelStatus;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartOperationDto {
  @IsUUID()
  stationId: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteOperationDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
