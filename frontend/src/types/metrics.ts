// Metrics and analytics types

export interface StationMetrics {
  station_id: string;
  pending_count: number;
  in_progress_count: number;
  completed_today: number;
  avg_cycle_time_seconds: number;
}

export interface DashboardMetrics {
  total_wip: number;
  completed_today: number;
  stations: StationMetrics[];
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalOperations: number;
  activeOperators: number;
  assignedStations: number;
  totalStations: number;
  recentActivity: any[];
}

export interface BarrelProcessInfo {
  id: string;
  caliber: string;
  length_inches: number;
  twist_rate: string;
  material: string;
  status: string;
  priority: string;
  currentStation: string;
  currentStationId?: string;
  progressPercentage: number;
  isActive: boolean;
  operationHistory: any[];
  current_operator_name?: string;
}
