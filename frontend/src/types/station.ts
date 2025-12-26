// Station types and interfaces

export interface SimpleStation {
  id: string;
  name: string;
  sequence: number;
  description?: string;
}

export interface StationAssignment {
  userId: string;
  stationId: string;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
}
