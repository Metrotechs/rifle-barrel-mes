import type { Barrel, Station, CreateBarrelDto, StartOperationDto, CompleteOperationDto } from '../types';

// API Service with localStorage fallback for demo mode

export interface OperationLog {
  id: string;
  barrel_id: string;
  station_name: string;
  started_at: string;
  completed_at?: string;
  paused_at?: string;
  resumed_at?: string;
  duration_seconds?: number;
  operator_name?: string;
  notes?: string;
  exception_code?: string;
}

class APIService {
  private baseURL: string;
  private isDemo: boolean;
  private localStorage = window.localStorage;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    this.isDemo = import.meta.env.VITE_DEMO_MODE === 'true' || true; // Default to demo mode
  }

  // Initialize demo data in localStorage
  private initializeDemoData() {
    if (!this.localStorage.getItem('barrels')) {
      const demoBarrels: Barrel[] = [
        {
          id: '1',
          caliber: '.308 Winchester',
          length_inches: 24,
          twist_rate: '1:10',
          material: '416R Stainless',
          status: 'DRILLING_PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          caliber: '6.5 Creedmoor',
          length_inches: 26,
          twist_rate: '1:8',
          material: '416R Stainless',
          status: 'DRILLING_PENDING',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          caliber: '.223 Wylde',
          length_inches: 18,
          twist_rate: '1:7',
          material: '4140 Chrome Moly',
          status: 'REAMING_IN_PROGRESS',
          current_station: 'Reaming',
          started_at: new Date(Date.now() - 900000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      this.localStorage.setItem('barrels', JSON.stringify(demoBarrels));
    }

    if (!this.localStorage.getItem('operationLogs')) {
      const demoLogs: OperationLog[] = [
        {
          id: '1',
          barrel_id: '3',
          station_name: 'Drilling',
          started_at: new Date(Date.now() - 7200000).toISOString(),
          completed_at: new Date(Date.now() - 3600000).toISOString(),
          duration_seconds: 3600,
          operator_name: 'John Smith'
        }
      ];
      this.localStorage.setItem('operationLogs', JSON.stringify(demoLogs));
    }
  }

  // Barrel operations
  async getBarrels(): Promise<Barrel[]> {
    if (this.isDemo) {
      this.initializeDemoData();
      const barrels = JSON.parse(this.localStorage.getItem('barrels') || '[]');
      const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
      
      // Attach logs to barrels
      return barrels.map((barrel: Barrel) => ({
        ...barrel,
        operation_logs: logs.filter((log: OperationLog) => log.barrel_id === barrel.id)
      }));
    }

    const response = await fetch(`${this.baseURL}/barrels`);
    return response.json();
  }

  async createBarrel(data: Omit<Barrel, 'id' | 'created_at' | 'updated_at'>): Promise<Barrel> {
    if (this.isDemo) {
      const barrels = JSON.parse(this.localStorage.getItem('barrels') || '[]');
      const newBarrel: Barrel = {
        ...data,
        id: Date.now().toString(),
        status: 'DRILLING_PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      barrels.push(newBarrel);
      this.localStorage.setItem('barrels', JSON.stringify(barrels));
      return newBarrel;
    }

    const response = await fetch(`${this.baseURL}/barrels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async startOperation(barrelId: string, stationName: string): Promise<Barrel> {
    if (this.isDemo) {
      const barrels = JSON.parse(this.localStorage.getItem('barrels') || '[]');
      const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
      
      const updatedBarrels = barrels.map((barrel: Barrel) => {
        if (barrel.id === barrelId) {
          const stationStatus = stationName.toUpperCase().replace(' ', '_');
          return {
            ...barrel,
            status: `${stationStatus}_IN_PROGRESS`,
            current_station: stationName,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return barrel;
      });

      // Create operation log
      const newLog: OperationLog = {
        id: Date.now().toString(),
        barrel_id: barrelId,
        station_name: stationName,
        started_at: new Date().toISOString(),
        operator_name: 'Current User'
      };
      logs.push(newLog);

      this.localStorage.setItem('barrels', JSON.stringify(updatedBarrels));
      this.localStorage.setItem('operationLogs', JSON.stringify(logs));
      
      return updatedBarrels.find((b: Barrel) => b.id === barrelId);
    }

    const response = await fetch(`${this.baseURL}/barrels/${barrelId}/start`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station_name: stationName })
    });
    return response.json();
  }

  async completeOperation(barrelId: string, notes?: string): Promise<Barrel> {
    if (this.isDemo) {
      const barrels = JSON.parse(this.localStorage.getItem('barrels') || '[]');
      const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
      
      const barrel = barrels.find((b: Barrel) => b.id === barrelId);
      if (!barrel) throw new Error('Barrel not found');

      const currentStationName = barrel.current_station;
      const stations = this.getStations();
      const currentStation = stations.find(s => s.name === currentStationName);
      const nextStation = stations.find(s => s.sequence === (currentStation?.sequence || 0) + 1);

      // Update barrel status
      const updatedBarrels = barrels.map((b: Barrel) => {
        if (b.id === barrelId) {
          const nextStatus = nextStation 
            ? `${nextStation.name.toUpperCase().replace(' ', '_')}_PENDING`
            : 'COMPLETED';
          
          return {
            ...b,
            status: nextStatus,
            current_station: undefined,
            started_at: undefined,
            updated_at: new Date().toISOString()
          };
        }
        return b;
      });

      // Update operation log
      const currentLog = logs.find((log: OperationLog) => 
        log.barrel_id === barrelId && !log.completed_at
      );
      
      if (currentLog) {
        currentLog.completed_at = new Date().toISOString();
        currentLog.duration_seconds = Math.floor(
          (new Date(currentLog.completed_at).getTime() - new Date(currentLog.started_at).getTime()) / 1000
        );
        if (notes) currentLog.notes = notes;
      }

      this.localStorage.setItem('barrels', JSON.stringify(updatedBarrels));
      this.localStorage.setItem('operationLogs', JSON.stringify(logs));
      
      return updatedBarrels.find((b: Barrel) => b.id === barrelId);
    }

    const response = await fetch(`${this.baseURL}/barrels/${barrelId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return response.json();
  }

  async pauseOperation(barrelId: string): Promise<void> {
    if (this.isDemo) {
      const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
      const currentLog = logs.find((log: OperationLog) => 
        log.barrel_id === barrelId && !log.completed_at && !log.paused_at
      );
      
      if (currentLog) {
        currentLog.paused_at = new Date().toISOString();
        this.localStorage.setItem('operationLogs', JSON.stringify(logs));
      }
      return;
    }

    await fetch(`${this.baseURL}/barrels/${barrelId}/pause`, { method: 'PUT' });
  }

  async resumeOperation(barrelId: string): Promise<void> {
    if (this.isDemo) {
      const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
      const currentLog = logs.find((log: OperationLog) => 
        log.barrel_id === barrelId && !log.completed_at && log.paused_at
      );
      
      if (currentLog) {
        currentLog.resumed_at = new Date().toISOString();
        currentLog.paused_at = undefined;
        this.localStorage.setItem('operationLogs', JSON.stringify(logs));
      }
      return;
    }

    await fetch(`${this.baseURL}/barrels/${barrelId}/resume`, { method: 'PUT' });
  }

  // Station operations
  getStations(): Station[] {
    return [
      { id: '1', name: 'Drilling', sequence: 1, description: 'Initial barrel blank drilling' },
      { id: '2', name: 'Reaming', sequence: 2, description: 'Precision bore reaming' },
      { id: '3', name: 'Rifling', sequence: 3, description: 'Button/cut/hammer-forged rifling' },
      { id: '4', name: 'Heat Treat', sequence: 4, description: 'External heat treatment' },
      { id: '5', name: 'Lapping', sequence: 5, description: 'Hand/machine lapping' },
      { id: '6', name: 'Honing', sequence: 6, description: 'Optional honing/polishing' },
      { id: '7', name: 'Chambering', sequence: 7, description: 'CNC chambering & threading' },
      { id: '8', name: 'Inspection', sequence: 8, description: 'QC inspection & measurements' },
      { id: '9', name: 'Finishing', sequence: 9, description: 'Surface coating application' },
      { id: '10', name: 'Final QC', sequence: 10, description: 'Final quality control' }
    ];
  }

  async getStationQueue(stationId: string): Promise<Barrel[]> {
    const barrels = await this.getBarrels();
    const station = this.getStations().find(s => s.id === stationId);
    if (!station) return [];
    
    const stationStatus = station.name.toUpperCase().replace(' ', '_');
    return barrels.filter(b => 
      b.status === `${stationStatus}_PENDING` || 
      b.status === `${stationStatus}_IN_PROGRESS`
    );
  }

  // Metrics
  async getMetrics() {
    const barrels = await this.getBarrels();
    const logs = JSON.parse(this.localStorage.getItem('operationLogs') || '[]');
    const stations = this.getStations();

    const metrics = stations.map(station => {
      const stationStatus = station.name.toUpperCase().replace(' ', '_');
      const pending = barrels.filter(b => b.status === `${stationStatus}_PENDING`).length;
      const inProgress = barrels.filter(b => b.status === `${stationStatus}_IN_PROGRESS`).length;
      
      // Calculate average cycle time from logs
      const stationLogs = logs.filter((log: OperationLog) => 
        log.station_name === station.name && log.completed_at
      );
      
      const avgCycleTime = stationLogs.length > 0
        ? stationLogs.reduce((sum: number, log: OperationLog) => 
            sum + (log.duration_seconds || 0), 0) / stationLogs.length
        : 0;

      return {
        station_id: station.id,
        station_name: station.name,
        pending_count: pending,
        in_progress_count: inProgress,
        completed_today: stationLogs.filter((log: OperationLog) => {
          const completedAt = new Date(log.completed_at!);
          const today = new Date();
          return completedAt.toDateString() === today.toDateString();
        }).length,
        avg_cycle_time_seconds: Math.round(avgCycleTime)
      };
    });

    return {
      stations: metrics,
      total_wip: barrels.filter(b => !b.status.includes('COMPLETED')).length,
      completed_today: barrels.filter(b => {
        if (b.status !== 'COMPLETED') return false;
        const updatedAt = new Date(b.updated_at || b.created_at);
        const today = new Date();
        return updatedAt.toDateString() === today.toDateString();
      }).length
    };
  }
}

export const apiService = new APIService();
