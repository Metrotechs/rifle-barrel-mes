/**
 * MES API Service
 * Handles all data operations with localStorage and cross-tab synchronization
 */

import type { User, LoginSession, CreateUserInput } from '../types/user';
import type { SimpleBarrel, CreateBarrelInput } from '../types/barrel';
import type { SimpleStation, StationAssignment } from '../types/station';
import type { DashboardMetrics, SystemAnalytics, BarrelProcessInfo } from '../types/metrics';
import { 
  STATIONS, 
  DEFAULT_USERS, 
  DEFAULT_STATION_ASSIGNMENTS, 
  DEMO_BARRELS, 
  STORAGE_KEYS 
} from '../lib/constants';
import { safeJsonParse, stationNameToStatus, extractStationFromStatus } from '../lib/utils';

class MESApiService {
  private syncChannel: BroadcastChannel | null = null;
  private syncListeners = new Set<() => void>();
  private _lastBarrelCheck = 0;

  constructor() {
    this.initSync();
  }

  // ==================== SYNC METHODS ====================

  initSync(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('mes-sync');
      this.syncChannel.addEventListener('message', (event) => {
        if (event.data.type === 'DATA_CHANGED') {
          this.notifyDataChange();
        }
      });
    }
  }

  private broadcastChange(changeType: string): void {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'DATA_CHANGED',
        changeType,
        timestamp: new Date().toISOString(),
      });
    }
  }

  onDataChange(callback: () => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifyDataChange(): void {
    this.syncListeners.forEach((callback) => callback());
  }

  private async saveData(key: string, data: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
    this.broadcastChange(key);
    this.notifyDataChange();
  }

  // ==================== TABLET/SESSION METHODS ====================

  getTabletId(): string {
    let tabletId = localStorage.getItem(STORAGE_KEYS.TABLET_ID);
    if (!tabletId) {
      tabletId = `tablet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.TABLET_ID, tabletId);
    }
    return tabletId;
  }

  getTabletDisplayName(tabletId?: string): string {
    if (!tabletId) return 'Unknown';
    const parts = tabletId.split('_');
    return `Tablet-${parts[parts.length - 1]?.substr(0, 4) || 'XXX'}`;
  }

  // ==================== USER METHODS ====================

  getUsers(): User[] {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      try {
        const users = JSON.parse(stored);
        const uniqueNames = new Set(users.map((u: User) => u.fullName));
        if (uniqueNames.size === 1 && users.length > 1) {
          localStorage.removeItem(STORAGE_KEYS.USERS);
          return this.initializeDefaultUsers();
        }
        if (users.length < 10) {
          localStorage.removeItem(STORAGE_KEYS.USERS);
          return this.initializeDefaultUsers();
        }
        return users;
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USERS);
        return this.initializeDefaultUsers();
      }
    }
    return this.initializeDefaultUsers();
  }

  private initializeDefaultUsers(): User[] {
    const users = DEFAULT_USERS.map((u) => ({
      ...u,
      created_at: new Date().toISOString(),
    }));
    return users;
  }

  getCurrentUser(): User | null {
    return safeJsonParse<User | null>(
      localStorage.getItem(STORAGE_KEYS.CURRENT_USER),
      null
    );
  }

  getOperatorId(): string {
    const user = this.getCurrentUser();
    return user ? user.id : this.getTabletId();
  }

  getOperatorName(): string {
    const user = this.getCurrentUser();
    return user ? user.fullName : 'Anonymous';
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  async login(username: string, password: string): Promise<User | null> {
    const users = this.getUsers();
    const user = users.find((u) => u.username === username && u.isActive);

    if (user && password.length >= 3) {
      const session: LoginSession = {
        user,
        tabletId: this.getTabletId(),
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  }

  async logout(): Promise<void> {
    if (this.isImpersonating()) {
      const originalUser = await this.stopImpersonation();
      if (originalUser) return;
    }
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.ORIGINAL_USER_SESSION);
    localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_ACTIVE);
    localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_BY);
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    const users = this.getUsers();
    const newUser: User = {
      ...userData,
      id: `user${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    await this.saveData(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;
    users[userIndex] = { ...users[userIndex], ...updates };
    await this.saveData(STORAGE_KEYS.USERS, users);
    return users[userIndex];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const users = this.getUsers();
    const filteredUsers = users.filter((u) => u.id !== userId);
    if (filteredUsers.length === users.length) return false;
    await this.saveData(STORAGE_KEYS.USERS, filteredUsers);
    return true;
  }

  // ==================== IMPERSONATION ====================

  isImpersonating(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IMPERSONATION_ACTIVE) === 'true';
  }

  getOriginalUser(): User | null {
    const originalSessionData = localStorage.getItem(STORAGE_KEYS.ORIGINAL_USER_SESSION);
    if (originalSessionData && this.isImpersonating()) {
      const originalSession = JSON.parse(originalSessionData);
      return originalSession.user;
    }
    return null;
  }

  async impersonateUser(targetUserId: string): Promise<User | null> {
    const currentUser = this.getCurrentUser();
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === targetUserId && u.isActive);

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
      throw new Error('Access denied: Only administrators and supervisors can impersonate users.');
    }

    if (currentUser.role === 'supervisor' && targetUser?.role !== 'operator') {
      throw new Error('Access denied: Supervisors can only impersonate operator accounts.');
    }

    if (targetUser?.role === 'admin' && currentUser.role === 'admin' && targetUser.id !== currentUser.id) {
      throw new Error('Access denied: Admins cannot impersonate other admin accounts.');
    }

    if (targetUser) {
      const originalSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      localStorage.setItem(STORAGE_KEYS.ORIGINAL_USER_SESSION, originalSession || '');
      localStorage.setItem(STORAGE_KEYS.IMPERSONATION_ACTIVE, 'true');
      localStorage.setItem(STORAGE_KEYS.IMPERSONATED_BY, currentUser.id);

      const impersonationSession: LoginSession = {
        user: targetUser,
        tabletId: this.getTabletId(),
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(impersonationSession));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(targetUser));
      return targetUser;
    }
    return null;
  }

  async stopImpersonation(): Promise<User | null> {
    const originalSessionData = localStorage.getItem(STORAGE_KEYS.ORIGINAL_USER_SESSION);
    if (originalSessionData && this.isImpersonating()) {
      const originalSession = JSON.parse(originalSessionData);
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(originalSession));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(originalSession.user));
      localStorage.removeItem(STORAGE_KEYS.ORIGINAL_USER_SESSION);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATION_ACTIVE);
      localStorage.removeItem(STORAGE_KEYS.IMPERSONATED_BY);
      return originalSession.user;
    }
    return null;
  }

  // ==================== STATION METHODS ====================

  getStations(): SimpleStation[] {
    return [...STATIONS];
  }

  getStationAssignments(): StationAssignment[] {
    const stored = localStorage.getItem(STORAGE_KEYS.STATION_ASSIGNMENTS);
    if (stored) {
      try {
        const assignments = JSON.parse(stored);
        const activeAssignments = assignments.filter((a: StationAssignment) => a.isActive);
        if (activeAssignments.length === 0) {
          localStorage.removeItem(STORAGE_KEYS.STATION_ASSIGNMENTS);
          return this.initializeDefaultAssignments();
        }
        return assignments;
      } catch {
        localStorage.removeItem(STORAGE_KEYS.STATION_ASSIGNMENTS);
        return this.initializeDefaultAssignments();
      }
    }
    return this.initializeDefaultAssignments();
  }

  private initializeDefaultAssignments(): StationAssignment[] {
    return DEFAULT_STATION_ASSIGNMENTS.map((a) => ({
      ...a,
      assignedAt: new Date().toISOString(),
    }));
  }

  getAssignedStations(userId: string): string[] {
    const assignments = this.getStationAssignments();
    return assignments.filter((a) => a.userId === userId && a.isActive).map((a) => a.stationId);
  }

  getStationOperator(stationId: string): User | null {
    const assignments = this.getStationAssignments();
    const assignment = assignments.find((a) => a.stationId === stationId && a.isActive);
    if (!assignment) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === assignment.userId) || null;
  }

  canUserAccessStation(stationId: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') return true;
    const assignedStations = this.getAssignedStations(currentUser.id);
    return assignedStations.includes(stationId);
  }

  async assignUserToStation(userId: string, stationId: string): Promise<StationAssignment> {
    const assignments = this.getStationAssignments();
    const currentUser = this.getCurrentUser();
    const filteredAssignments = assignments.filter((a) => a.stationId !== stationId || !a.isActive);
    const newAssignment: StationAssignment = {
      userId,
      stationId,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser?.id || 'system',
      isActive: true,
    };
    filteredAssignments.push(newAssignment);
    await this.saveData(STORAGE_KEYS.STATION_ASSIGNMENTS, filteredAssignments);
    return newAssignment;
  }

  async removeStationAssignment(userId: string, stationId: string): Promise<boolean> {
    const assignments = this.getStationAssignments();
    const filteredAssignments = assignments.filter(
      (a) => !(a.userId === userId && a.stationId === stationId && a.isActive)
    );
    if (filteredAssignments.length === assignments.length) return false;
    await this.saveData(STORAGE_KEYS.STATION_ASSIGNMENTS, filteredAssignments);
    return true;
  }

  // ==================== BARREL METHODS ====================

  async getBarrels(): Promise<SimpleBarrel[]> {
    const stored = localStorage.getItem(STORAGE_KEYS.BARRELS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return this.initializeDemoBarrels();
      }
    }
    return this.initializeDemoBarrels();
  }

  private initializeDemoBarrels(): SimpleBarrel[] {
    const barrels = DEMO_BARRELS.map((b) => ({
      ...b,
      created_at: new Date().toISOString(),
    }));
    return barrels;
  }

  async createBarrel(data: CreateBarrelInput): Promise<SimpleBarrel> {
    const barrels = await this.getBarrels();
    const newBarrel: SimpleBarrel = {
      ...data,
      id: Date.now().toString(),
      status: 'DRILLING_PENDING',
      created_at: new Date().toISOString(),
      operation_logs: [],
    };
    barrels.push(newBarrel);
    await this.saveData(STORAGE_KEYS.BARRELS, barrels);
    return newBarrel;
  }

  isCurrentOperator(barrel: SimpleBarrel): boolean {
    return barrel.current_operator_id === this.getOperatorId();
  }

  async startOperation(barrelId: string, stationName: string): Promise<SimpleBarrel> {
    const stations = this.getStations();
    const targetStation = stations.find((s) => s.name === stationName);
    if (targetStation && !this.canUserAccessStation(targetStation.id)) {
      throw new Error(
        `Access denied: You are not authorized to operate ${stationName} station.`
      );
    }

    const barrels = await this.getBarrels();
    const barrel = barrels.find((b) => b.id === barrelId);
    if (!barrel) throw new Error('Barrel not found');

    if (barrel.current_operator_id && barrel.current_operator_id !== this.getOperatorId()) {
      throw new Error(
        `Barrel is currently being worked on by ${barrel.current_operator_name || 'another operator'}`
      );
    }

    const stationStatus = stationNameToStatus(stationName);
    barrel.status = `${stationStatus}_IN_PROGRESS`;
    barrel.started_at = new Date().toISOString();
    barrel.current_operator_id = this.getOperatorId();
    barrel.current_operator_name = this.getOperatorName();
    barrel.current_tablet_id = this.getTabletId();

    if (!barrel.operation_logs) barrel.operation_logs = [];
    barrel.operation_logs.push({
      station_name: stationName,
      start_time: new Date().toISOString(),
      end_time: null,
      operator_id: this.getOperatorId(),
      operator_name: this.getOperatorName(),
      tablet_id: this.getTabletId(),
    });

    await this.saveData(STORAGE_KEYS.BARRELS, barrels);
    return barrel;
  }

  async completeOperation(barrelId: string, notes?: string): Promise<SimpleBarrel> {
    const barrels = await this.getBarrels();
    const barrel = barrels.find((b) => b.id === barrelId);
    if (!barrel) throw new Error('Barrel not found');

    const stations = this.getStations();
    const currentStationName = extractStationFromStatus(barrel.status);
    const currentStation = stations.find(
      (s) => stationNameToStatus(s.name) === currentStationName
    );

    if (currentStation && !this.canUserAccessStation(currentStation.id)) {
      throw new Error(
        `Access denied: You are not authorized to operate ${currentStation.name} station.`
      );
    }

    if (barrel.current_operator_id && barrel.current_operator_id !== this.getOperatorId()) {
      throw new Error(
        `Only ${barrel.current_operator_name || 'the operator who started this operation'} can complete it`
      );
    }

    const nextStation = stations.find((s) => s.sequence === (currentStation?.sequence || 0) + 1);

    if (barrel.operation_logs && barrel.operation_logs.length > 0) {
      const lastLog = barrel.operation_logs[barrel.operation_logs.length - 1];
      lastLog.end_time = new Date().toISOString();
      if (notes) lastLog.notes = notes;
    }

    barrel.status = nextStation
      ? `${stationNameToStatus(nextStation.name)}_PENDING`
      : 'COMPLETED';
    barrel.completed_at = barrel.status === 'COMPLETED' ? new Date().toISOString() : undefined;
    barrel.started_at = undefined;
    barrel.current_operator_id = undefined;
    barrel.current_operator_name = undefined;
    barrel.current_tablet_id = undefined;

    await this.saveData(STORAGE_KEYS.BARRELS, barrels);
    return barrel;
  }

  async pauseOperation(_barrelId: string): Promise<void> {
    // Implementation for pause
  }

  async resumeOperation(_barrelId: string): Promise<void> {
    // Implementation for resume
  }

  // ==================== METRICS ====================

  async getMetrics(): Promise<DashboardMetrics> {
    const barrels = await this.getBarrels();
    const stations = this.getStations();

    return {
      total_wip: barrels.filter((b) => !b.status.includes('COMPLETED')).length,
      completed_today: barrels.filter((b) => b.status === 'COMPLETED').length,
      stations: stations.map((station) => {
        const stationStatus = stationNameToStatus(station.name);
        return {
          station_id: station.id,
          pending_count: barrels.filter((b) => b.status === `${stationStatus}_PENDING`).length,
          in_progress_count: barrels.filter((b) => b.status === `${stationStatus}_IN_PROGRESS`).length,
          completed_today: 0,
          avg_cycle_time_seconds: 1800,
        };
      }),
    };
  }

  async getSystemAnalytics(): Promise<SystemAnalytics> {
    const barrels = await this.getBarrels();
    const users = this.getUsers();
    const assignments = this.getStationAssignments();

    const totalOperations = barrels.reduce(
      (sum, barrel) => sum + (barrel.operation_logs?.length || 0),
      0
    );

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      totalOperations,
      activeOperators: users.filter((u) => u.isActive && u.role === 'operator').length,
      assignedStations: assignments.filter((a) => a.isActive).length,
      totalStations: this.getStations().length,
      recentActivity: barrels
        .flatMap((b) => b.operation_logs || [])
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 10),
    };
  }

  async getBarrelProcessInfo(): Promise<BarrelProcessInfo[]> {
    const barrels = await this.getBarrels();
    const stations = this.getStations();

    return barrels.map((barrel) => {
      const stationStatus = extractStationFromStatus(barrel.status);
      const currentStation = stations.find(
        (s) => stationNameToStatus(s.name) === stationStatus
      );

      const currentStationIndex = currentStation
        ? currentStation.sequence
        : barrel.status === 'COMPLETED'
        ? stations.length + 1
        : 0;
      const progressPercentage = Math.round((currentStationIndex / (stations.length + 1)) * 100);

      return {
        ...barrel,
        currentStation:
          currentStation?.name || (barrel.status === 'COMPLETED' ? 'Completed' : 'Not Started'),
        currentStationId: currentStation?.id,
        progressPercentage,
        isActive: barrel.status.includes('IN_PROGRESS'),
        operationHistory: barrel.operation_logs || [],
      };
    });
  }
}

// Export singleton instance
export const mesApi = new MESApiService();
