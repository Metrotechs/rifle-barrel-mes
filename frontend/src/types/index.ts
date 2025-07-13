export const BarrelStatus = {
  DRILLING_PENDING: 'DRILLING_PENDING',
  DRILLING_IN_PROGRESS: 'DRILLING_IN_PROGRESS',
  REAMING_PENDING: 'REAMING_PENDING',
  REAMING_IN_PROGRESS: 'REAMING_IN_PROGRESS',
  RIFLING_PENDING: 'RIFLING_PENDING',
  RIFLING_IN_PROGRESS: 'RIFLING_IN_PROGRESS',
  HEAT_TREAT_PENDING: 'HEAT_TREAT_PENDING',
  HEAT_TREAT_IN_PROGRESS: 'HEAT_TREAT_IN_PROGRESS',
  LAPPING_PENDING: 'LAPPING_PENDING',
  LAPPING_IN_PROGRESS: 'LAPPING_IN_PROGRESS',
  HONING_PENDING: 'HONING_PENDING',
  HONING_IN_PROGRESS: 'HONING_IN_PROGRESS',
  CHAMBERING_PENDING: 'CHAMBERING_PENDING',
  CHAMBERING_IN_PROGRESS: 'CHAMBERING_IN_PROGRESS',
  INSPECTION_PENDING: 'INSPECTION_PENDING',
  INSPECTION_IN_PROGRESS: 'INSPECTION_IN_PROGRESS',
  FINISHING_PENDING: 'FINISHING_PENDING',
  FINISHING_IN_PROGRESS: 'FINISHING_IN_PROGRESS',
  FINAL_QC_PENDING: 'FINAL_QC_PENDING',
  FINAL_QC_IN_PROGRESS: 'FINAL_QC_IN_PROGRESS',
  READY_TO_SHIP: 'READY_TO_SHIP',
  REWORK: 'REWORK',
  SCRAP: 'SCRAP',
  HOLD: 'HOLD',
} as const;

export type BarrelStatus = typeof BarrelStatus[keyof typeof BarrelStatus];

export const StationName = {
  DRILLING: 'DRILLING',
  REAMING: 'REAMING',
  RIFLING: 'RIFLING',
  HEAT_TREAT: 'HEAT_TREAT',
  LAPPING: 'LAPPING',
  HONING: 'HONING',
  CHAMBERING: 'CHAMBERING',
  INSPECTION: 'INSPECTION',
  FINISHING: 'FINISHING',
  FINAL_QC: 'FINAL_QC',
} as const;

export type StationName = typeof StationName[keyof typeof StationName];

export interface Barrel {
  id: string;
  caliber: string;
  lengthIn: number;
  twist: string;
  status: BarrelStatus;
  serialNumber?: string;
  barcode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  operationLogs?: OperationLog[];
}

export interface Station {
  id: string;
  name: StationName;
  sequence: number;
  description?: string;
  isActive: boolean;
}

export interface OperationLog {
  id: string;
  barrelId: string;
  stationId: string;
  operatorId?: string;
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  durationSec?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  station?: Station;
}

export interface CreateBarrelDto {
  caliber: string;
  lengthIn: number;
  twist: string;
  serialNumber?: string;
  barcode?: string;
  metadata?: Record<string, any>;
}

export interface StartOperationDto {
  stationId: string;
  operatorId?: string;
  notes?: string;
}

export interface CompleteOperationDto {
  notes?: string;
  metadata?: Record<string, any>;
}
