// Constants for the MES application

export const STATIONS = [
  { id: '1', name: 'Drilling', sequence: 1, description: 'Initial barrel blank drilling' },
  { id: '2', name: 'Reaming', sequence: 2, description: 'Precision bore reaming' },
  { id: '3', name: 'Rifling', sequence: 3, description: 'Button/cut/hammer-forged rifling' },
  { id: '4', name: 'Heat Treat', sequence: 4, description: 'External heat treatment' },
  { id: '5', name: 'Lapping', sequence: 5, description: 'Hand/machine lapping' },
  { id: '6', name: 'Honing', sequence: 6, description: 'Optional honing/polishing' },
  { id: '7', name: 'Fluting', sequence: 7, description: 'External barrel fluting for weight reduction' },
  { id: '8', name: 'Chambering', sequence: 8, description: 'CNC chambering & threading' },
  { id: '9', name: 'Inspection', sequence: 9, description: 'QC inspection & measurements' },
  { id: '10', name: 'Finishing', sequence: 10, description: 'Surface coating application' },
  { id: '11', name: 'Final QC', sequence: 11, description: 'Final quality control' },
] as const;

export const DEFAULT_USERS = [
  { id: 'user001', username: 'drill_op', fullName: 'David Miller', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user002', username: 'ream_op', fullName: 'Rachel Thompson', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user003', username: 'rifle_op', fullName: 'Richard Garcia', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user004', username: 'heat_op', fullName: 'Helen Martinez', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user005', username: 'lap_op', fullName: 'Lucas Anderson', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user006', username: 'hone_op', fullName: 'Hannah Taylor', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user007', username: 'flute_op', fullName: 'Felix Turner', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user008', username: 'chamber_op', fullName: 'Charles Wilson', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user009', username: 'inspect_op', fullName: 'Isabella Moore', role: 'operator' as const, department: 'Quality Control', isActive: true },
  { id: 'user010', username: 'finish_op', fullName: 'Frank Johnson', role: 'operator' as const, department: 'Manufacturing', isActive: true },
  { id: 'user011', username: 'qc_op', fullName: 'Quinn Davis', role: 'operator' as const, department: 'Quality Control', isActive: true },
  { id: 'user012', username: 'supervisor', fullName: 'Sarah Wilson', role: 'supervisor' as const, department: 'Manufacturing', isActive: true },
  { id: 'user013', username: 'admin', fullName: 'System Administrator', role: 'admin' as const, department: 'IT', isActive: true },
  { id: 'user014', username: 'testuser', fullName: 'Unassigned User', role: 'operator' as const, department: 'Manufacturing', isActive: true },
];

export const DEFAULT_STATION_ASSIGNMENTS = [
  { userId: 'user001', stationId: '1', isActive: true, assignedBy: 'user013' },
  { userId: 'user002', stationId: '2', isActive: true, assignedBy: 'user013' },
  { userId: 'user003', stationId: '3', isActive: true, assignedBy: 'user013' },
  { userId: 'user004', stationId: '4', isActive: true, assignedBy: 'user013' },
  { userId: 'user005', stationId: '5', isActive: true, assignedBy: 'user013' },
  { userId: 'user006', stationId: '6', isActive: true, assignedBy: 'user013' },
  { userId: 'user007', stationId: '7', isActive: true, assignedBy: 'user013' },
  { userId: 'user008', stationId: '8', isActive: true, assignedBy: 'user013' },
  { userId: 'user009', stationId: '9', isActive: true, assignedBy: 'user013' },
  { userId: 'user010', stationId: '10', isActive: true, assignedBy: 'user013' },
  { userId: 'user011', stationId: '11', isActive: true, assignedBy: 'user013' },
];

export const DEMO_BARRELS = [
  {
    id: '1',
    caliber: '.308 Winchester',
    length_inches: 24,
    twist_rate: '1:10',
    material: '416R Stainless',
    status: 'DRILLING_PENDING',
    operation_logs: [],
    priority: 'Medium' as const,
  },
  {
    id: '2',
    caliber: '6.5 Creedmoor',
    length_inches: 26,
    twist_rate: '1:8',
    material: '416R Stainless',
    status: 'DRILLING_PENDING',
    operation_logs: [],
    priority: 'High' as const,
  },
];

export const STORAGE_KEYS = {
  USERS: 'users',
  BARRELS: 'barrels',
  STATION_ASSIGNMENTS: 'station_assignments',
  USER_SESSION: 'user_session',
  CURRENT_USER: 'current_user',
  TABLET_ID: 'tablet_id',
  IMPERSONATION_ACTIVE: 'impersonation_active',
  ORIGINAL_USER_SESSION: 'original_user_session',
  IMPERSONATED_BY: 'impersonated_by',
  FIREBASE_CONFIG: 'firebase_config',
  FIREBASE_ENABLED: 'firebase_enabled',
} as const;

export const POLLING_INTERVALS = {
  DASHBOARD: 5000,
  ADMIN_PANEL: 15000,
} as const;
