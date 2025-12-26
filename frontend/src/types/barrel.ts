// Barrel types and interfaces

export type Priority = 'High' | 'Medium' | 'Low';

export interface OperationLog {
  station_name: string;
  start_time: string;
  end_time: string | null;
  operator_id?: string;
  operator_name?: string;
  tablet_id?: string;
  notes?: string;
}

export interface SimpleBarrel {
  id: string;
  caliber: string;
  length_inches: number;
  twist_rate: string;
  material: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  operation_logs: OperationLog[];
  priority: Priority;
  current_operator_id?: string;
  current_operator_name?: string;
  current_tablet_id?: string;
}

export interface CreateBarrelInput {
  caliber: string;
  length_inches: number;
  twist_rate: string;
  material: string;
  priority: Priority;
}
