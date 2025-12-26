/*
 * MULTI-TABLET MANUFACTURING EXECUTION SYSTEM (MES)
 * 
 * SYNC SETUP INSTRUCTIONS:
 * ========================
 * 
 * To enable real-time synchronization across multiple tablets:
 * 
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Realtime Database in your Firebase project
 * 3. Set database rules to allow read/write (for development):
 *    {
 *      "rules": {
 *        ".read": true,
 *        ".write": true
 *      }
 *    }
 * 4. Get your Firebase config from Project Settings > General > Your apps
 * 5. Replace the values in syncConfig below with your Firebase config
 * 6. Set syncConfig.enabled = true
 * 7. Install Firebase: npm install firebase
 * 8. Deploy to all tablets - they will automatically sync in real-time!
 * 
 * CURRENT STATUS: Running in LOCAL MODE (no sync between tablets)
 * Each tablet maintains its own independent data in localStorage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Menu, Card, Button, Modal, Table, Statistic, Row, Col, Input, Select, Form, notification, Spin, Typography, Space
} from 'antd';

const { Title } = Typography;
import {
  PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined, ClockCircleOutlined, BarChartOutlined, AppstoreOutlined, SafetyCertificateOutlined, StopOutlined, WarningOutlined, CheckSquareOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';

// --- TYPE DEFINITIONS ---
// Quality Control & Inspection Types
interface InspectionMeasurement {
  name: string;
  value: number;
  unit: string;
  min_spec: number;
  max_spec: number;
  passed: boolean;
}

interface Defect {
  id: string;
  type: 'surface' | 'dimensional' | 'material' | 'other';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  location?: string;
  detected_by: string;
  detected_at: string;
  resolved?: boolean;
  resolution_notes?: string;
}

interface InspectionRecord {
  id: string;
  barrel_id: string;
  station_id: string;
  station_name: string;
  inspector_id: string;
  inspector_name: string;
  inspection_type: 'in_process' | 'final' | 'incoming';
  measurements: InspectionMeasurement[];
  defects: Defect[];
  overall_result: 'pass' | 'fail' | 'conditional';
  notes?: string;
  created_at: string;
}

interface SimpleBarrel {
  id: string;
  caliber: string;
  length_inches: number;
  twist_rate: string;
  material: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  operation_logs: any[];
  priority: 'High' | 'Medium' | 'Low';
  // Operation ownership tracking with user info
  current_operator_id?: string;
  current_operator_name?: string;
  current_tablet_id?: string;
  // Quality Control fields
  qc_status?: 'pending' | 'passed' | 'failed' | 'hold';
  hold_reason?: string;
  hold_date?: string;
  held_by?: string;
  inspections?: InspectionRecord[];
}

interface SimpleStation {
  id: string;
  name: string;
  sequence: number;
  description?: string;
}

// User authentication interfaces
interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'operator' | 'supervisor' | 'admin';
  department: string;
  isActive: boolean;
  created_at: string;
}

interface LoginSession {
  user: User;
  tabletId: string;
  loginTime: string;
}

interface StationAssignment {
  userId: string;
  stationId: string;
  assignedAt: string;
  assignedBy: string;
  isActive: boolean;
}

// --- REAL-TIME SYNC CONFIGURATION ---
// For multi-tablet sync, we'll use Firebase Realtime Database
// This enables real-time synchronization across all connected devices

interface SyncConfig {
  enabled: boolean;
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
  };
}

// Configure this for your Firebase project
const syncConfig: SyncConfig = {
  enabled: false, // Set to true when Firebase is configured
  firebaseConfig: {
    // Replace with your Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com", 
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id"
  }
};

// Simple Mock API Service with Multi-Browser Sync Support
const mockApiService = {
  // Cross-browser sync mechanism using BroadcastChannel API
  syncChannel: typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mes-sync') : null,
  
  // Private property for throttling logs
  _lastBarrelCheck: 0,
  
  // Initialize sync channel listener
  initSync: () => {
    if (mockApiService.syncChannel) {
      mockApiService.syncChannel.addEventListener('message', (event) => {
        if (event.data.type === 'DATA_CHANGED') {
          // Notify all listeners when data changes in another browser/tab
          mockApiService.notifyDataChange();
        }
      });
    }
  },
  
  // Broadcast data changes to other browsers/tabs
  broadcastChange: (changeType: string) => {
    if (mockApiService.syncChannel) {
      mockApiService.syncChannel.postMessage({
        type: 'DATA_CHANGED',
        changeType,
        timestamp: new Date().toISOString()
      });
    }
  },
  // User authentication and management
  getUsers: (): User[] => {
    const defaultUsers: User[] = [
      // Station operators (one for each production station)
      { id: 'user001', username: 'drill_op', fullName: 'David Miller', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user002', username: 'ream_op', fullName: 'Rachel Thompson', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user003', username: 'rifle_op', fullName: 'Richard Garcia', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user004', username: 'heat_op', fullName: 'Helen Martinez', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user005', username: 'lap_op', fullName: 'Lucas Anderson', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user006', username: 'hone_op', fullName: 'Hannah Taylor', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user007', username: 'flute_op', fullName: 'Felix Turner', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user008', username: 'chamber_op', fullName: 'Charles Wilson', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user009', username: 'inspect_op', fullName: 'Isabella Moore', role: 'operator' as const, department: 'Quality Control', isActive: true, created_at: new Date().toISOString() },
      { id: 'user010', username: 'finish_op', fullName: 'Frank Johnson', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user011', username: 'qc_op', fullName: 'Quinn Davis', role: 'operator' as const, department: 'Quality Control', isActive: true, created_at: new Date().toISOString() },
      
      // Supervisors and admin
      { id: 'user012', username: 'supervisor', fullName: 'Sarah Wilson', role: 'supervisor' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user013', username: 'admin', fullName: 'System Administrator', role: 'admin' as const, department: 'IT', isActive: true, created_at: new Date().toISOString() },
      
      // Test user with no assignment
      { id: 'user014', username: 'testuser', fullName: 'Unassigned User', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() }
    ];
    
    const stored = localStorage.getItem('users');
    if (stored) {
      try {
        const users = JSON.parse(stored);
        
        // Check for data corruption - if all users have the same fullName, reset data
        const uniqueNames = new Set(users.map((u: User) => u.fullName));
        if (uniqueNames.size === 1 && users.length > 1) {
          console.warn('Detected corrupted user data in localStorage - resetting to defaults');
          localStorage.removeItem('users');
          return defaultUsers;
        }
        
        // Check if we have the minimum expected users
        if (users.length < 10) {
          console.warn('Insufficient user data in localStorage - resetting to defaults');
          localStorage.removeItem('users');
          return defaultUsers;
        }
        
        return users;
      } catch (error) {
        console.warn('Invalid user data in localStorage - resetting to defaults');
        localStorage.removeItem('users');
        return defaultUsers;
      }
    }
    
    return defaultUsers;
  },

  // Admin user management functions
  createUser: async (userData: Omit<User, 'id' | 'created_at'>): Promise<User> => {
    const users = mockApiService.getUsers();
    const newUser: User = {
      ...userData,
      id: `user${Date.now()}`,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    await mockApiService.saveData('users', users);
    return newUser;
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    const users = mockApiService.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    await mockApiService.saveData('users', users);
    return users[userIndex];
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const users = mockApiService.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    if (filteredUsers.length === users.length) return false;
    
    await mockApiService.saveData('users', filteredUsers);
    return true;
  },

  // Station assignments
  getStationAssignments: (): StationAssignment[] => {
    const defaultAssignments: StationAssignment[] = [
      { userId: 'user001', stationId: '1', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // David Miller -> Drilling
      { userId: 'user002', stationId: '2', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Rachel Thompson -> Reaming
      { userId: 'user003', stationId: '3', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Richard Garcia -> Rifling
      { userId: 'user004', stationId: '4', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Helen Martinez -> Heat Treat
      { userId: 'user005', stationId: '5', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Lucas Anderson -> Lapping
      { userId: 'user006', stationId: '6', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Hannah Taylor -> Honing
      { userId: 'user007', stationId: '7', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Felix Turner -> Fluting
      { userId: 'user008', stationId: '8', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Charles Wilson -> Chambering
      { userId: 'user009', stationId: '9', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Isabella Moore -> Inspection
      { userId: 'user010', stationId: '10', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() }, // Frank Johnson -> Finishing
      { userId: 'user011', stationId: '11', isActive: true, assignedBy: 'user013', assignedAt: new Date().toISOString() } // Quinn Davis -> Final QC
    ];
    
    const stored = localStorage.getItem('station_assignments');
    if (stored) {
      try {
        const assignments = JSON.parse(stored);
        // Check if we have any active assignments
        const activeAssignments = assignments.filter((a: StationAssignment) => a.isActive);
        if (activeAssignments.length === 0) {
          console.warn('No active station assignments found - resetting to defaults');
          localStorage.removeItem('station_assignments');
          return defaultAssignments;
        }
        return assignments;
      } catch (error) {
        console.warn('Invalid station assignment data - resetting to defaults');
        localStorage.removeItem('station_assignments');
        return defaultAssignments;
      }
    }
    
    return defaultAssignments;
  },

  assignUserToStation: async (userId: string, stationId: string): Promise<StationAssignment> => {
    const assignments = mockApiService.getStationAssignments();
    const currentUser = mockApiService.getCurrentUser();
    
    // Remove any existing assignment for this station
    const filteredAssignments = assignments.filter(a => a.stationId !== stationId || !a.isActive);
    
    const newAssignment: StationAssignment = {
      userId,
      stationId,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser?.id || 'system',
      isActive: true
    };
    
    filteredAssignments.push(newAssignment);
    await mockApiService.saveData('station_assignments', filteredAssignments);
    return newAssignment;
  },

  removeStationAssignment: async (userId: string, stationId: string): Promise<boolean> => {
    const assignments = mockApiService.getStationAssignments();
    const filteredAssignments = assignments.filter(a => 
      !(a.userId === userId && a.stationId === stationId && a.isActive)
    );
    
    if (filteredAssignments.length === assignments.length) return false;
    
    await mockApiService.saveData('station_assignments', filteredAssignments);
    return true;
  },

  getAssignedStations: (userId: string): string[] => {
    const assignments = mockApiService.getStationAssignments();
    return assignments
      .filter(a => a.userId === userId && a.isActive)
      .map(a => a.stationId);
  },

  getStationOperator: (stationId: string): User | null => {
    const assignments = mockApiService.getStationAssignments();
    const assignment = assignments.find(a => a.stationId === stationId && a.isActive);
    if (!assignment) return null;
    
    const users = mockApiService.getUsers();
    return users.find(u => u.id === assignment.userId) || null;
  },

  // System analytics for admin
  getSystemAnalytics: async () => {
    const barrels = await mockApiService.getBarrels();
    const users = mockApiService.getUsers();
    const assignments = mockApiService.getStationAssignments();
    
    const totalOperations = barrels.reduce((sum, barrel) => sum + (barrel.operation_logs?.length || 0), 0);
    const activeOperators = users.filter(u => u.isActive && u.role === 'operator').length;
    const assignedStations = assignments.filter(a => a.isActive).length;
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      totalOperations,
      activeOperators,
      assignedStations,
      totalStations: mockApiService.getStations().length,
      recentActivity: barrels
        .flatMap(b => b.operation_logs || [])
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 10)
    };
  },

  // ============ QUALITY CONTROL & INSPECTION ============
  
  // Add an inspection record to a barrel
  addInspection: async (barrelId: string, inspection: Omit<InspectionRecord, 'id' | 'created_at' | 'barrel_id'>): Promise<InspectionRecord> => {
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (!barrel) throw new Error('Barrel not found');
    
    const newInspection: InspectionRecord = {
      ...inspection,
      id: `insp_${Date.now()}`,
      barrel_id: barrelId,
      created_at: new Date().toISOString()
    };
    
    if (!barrel.inspections) barrel.inspections = [];
    barrel.inspections.push(newInspection);
    
    // Auto-update QC status based on inspection result
    if (inspection.overall_result === 'fail') {
      barrel.qc_status = 'failed';
    } else if (inspection.overall_result === 'pass' && barrel.qc_status !== 'hold') {
      barrel.qc_status = 'passed';
    }
    
    await mockApiService.saveData('barrels', barrels);
    return newInspection;
  },
  
  // Place barrel on hold (quarantine)
  placeBarrelOnHold: async (barrelId: string, reason: string): Promise<SimpleBarrel> => {
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (!barrel) throw new Error('Barrel not found');
    
    const user = mockApiService.getCurrentUser();
    barrel.qc_status = 'hold';
    barrel.hold_reason = reason;
    barrel.hold_date = new Date().toISOString();
    barrel.held_by = user?.fullName || 'Unknown';
    
    await mockApiService.saveData('barrels', barrels);
    notification.warning({ message: `Barrel #${barrelId} placed on HOLD`, description: reason });
    return barrel;
  },
  
  // Release barrel from hold
  releaseBarrelFromHold: async (barrelId: string, notes?: string): Promise<SimpleBarrel> => {
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (!barrel) throw new Error('Barrel not found');
    
    barrel.qc_status = 'pending';
    barrel.hold_reason = undefined;
    barrel.hold_date = undefined;
    barrel.held_by = undefined;
    
    // Add a note to the last inspection if provided
    if (notes && barrel.inspections && barrel.inspections.length > 0) {
      const lastInspection = barrel.inspections[barrel.inspections.length - 1];
      lastInspection.notes = (lastInspection.notes || '') + ` [RELEASED: ${notes}]`;
    }
    
    await mockApiService.saveData('barrels', barrels);
    notification.success({ message: `Barrel #${barrelId} released from hold` });
    return barrel;
  },
  
  // Get QC summary statistics
  getQCStats: async () => {
    const barrels = await mockApiService.getBarrels();
    const totalInspections = barrels.reduce((sum, b) => sum + (b.inspections?.length || 0), 0);
    const passedInspections = barrels.reduce((sum, b) => 
      sum + (b.inspections?.filter(i => i.overall_result === 'pass').length || 0), 0);
    const failedInspections = barrels.reduce((sum, b) => 
      sum + (b.inspections?.filter(i => i.overall_result === 'fail').length || 0), 0);
    const barrelsOnHold = barrels.filter(b => b.qc_status === 'hold').length;
    
    return {
      totalInspections,
      passedInspections,
      failedInspections,
      passRate: totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0,
      barrelsOnHold,
      barrelsAwaitingInspection: barrels.filter(b => !b.qc_status || b.qc_status === 'pending').length
    };
  },
  
  // Get all defects across barrels
  getAllDefects: async (): Promise<(Defect & { barrel_id: string })[]> => {
    const barrels = await mockApiService.getBarrels();
    const allDefects: (Defect & { barrel_id: string })[] = [];
    
    barrels.forEach(barrel => {
      barrel.inspections?.forEach(inspection => {
        inspection.defects?.forEach(defect => {
          allDefects.push({ ...defect, barrel_id: barrel.id });
        });
      });
    });
    
    return allDefects.sort((a, b) => 
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );
  },

  // Enhanced authentication methods with impersonation support
  login: async (username: string, password: string): Promise<User | null> => {
    // Simple authentication - in real app, this would call a secure API
    const users = mockApiService.getUsers();
    const user = users.find(u => u.username === username && u.isActive);
    
    // For demo purposes, accept any password for existing users
    if (user && password.length >= 3) {
      const session: LoginSession = {
        user,
        tabletId: mockApiService.getTabletId(),
        loginTime: new Date().toISOString()
      };
      
      // Store session in localStorage
      localStorage.setItem('user_session', JSON.stringify(session));
      localStorage.setItem('current_user', JSON.stringify(user));
      
      return user;
    }
    
    return null;
  },

  // Impersonation login for admins and supervisors
  impersonateUser: async (targetUserId: string): Promise<User | null> => {
    const currentUser = mockApiService.getCurrentUser();
    const users = mockApiService.getUsers();
    const targetUser = users.find(u => u.id === targetUserId && u.isActive);
    
    // Security check: Only admins and supervisors can impersonate
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
      throw new Error('Access denied: Only administrators and supervisors can impersonate users.');
    }
    
    // Supervisors can only impersonate operators
    if (currentUser.role === 'supervisor' && targetUser?.role !== 'operator') {
      throw new Error('Access denied: Supervisors can only impersonate operator accounts.');
    }
    
    // Admins cannot impersonate other admins (security measure)
    if (targetUser?.role === 'admin' && currentUser.role === 'admin' && targetUser.id !== currentUser.id) {
      throw new Error('Access denied: Admins cannot impersonate other admin accounts.');
    }
    
    if (targetUser) {
      // Store original user info for restoration
      const originalSession = localStorage.getItem('user_session');
      localStorage.setItem('original_user_session', originalSession || '');
      localStorage.setItem('impersonation_active', 'true');
      localStorage.setItem('impersonated_by', currentUser.id);
      
      const impersonationSession: LoginSession = {
        user: targetUser,
        tabletId: mockApiService.getTabletId(),
        loginTime: new Date().toISOString()
      };
      
      // Update session to impersonated user
      localStorage.setItem('user_session', JSON.stringify(impersonationSession));
      localStorage.setItem('current_user', JSON.stringify(targetUser));
      
      return targetUser;
    }
    
    return null;
  },

  // Stop impersonation and return to original user
  stopImpersonation: async (): Promise<User | null> => {
    const originalSessionData = localStorage.getItem('original_user_session');
    
    if (originalSessionData && mockApiService.isImpersonating()) {
      const originalSession = JSON.parse(originalSessionData);
      
      // Restore original session
      localStorage.setItem('user_session', JSON.stringify(originalSession));
      localStorage.setItem('current_user', JSON.stringify(originalSession.user));
      
      // Clear impersonation flags
      localStorage.removeItem('original_user_session');
      localStorage.removeItem('impersonation_active');
      localStorage.removeItem('impersonated_by');
      
      return originalSession.user;
    }
    
    return null;
  },

  // Check if currently impersonating
  isImpersonating: (): boolean => {
    return localStorage.getItem('impersonation_active') === 'true';
  },

  // Get original user (the one doing the impersonation)
  getOriginalUser: (): User | null => {
    const originalSessionData = localStorage.getItem('original_user_session');
    if (originalSessionData && mockApiService.isImpersonating()) {
      const originalSession = JSON.parse(originalSessionData);
      return originalSession.user;
    }
    return null;
  },

  logout: async (): Promise<void> => {
    // If impersonating, stop impersonation instead of full logout
    if (mockApiService.isImpersonating()) {
      const originalUser = await mockApiService.stopImpersonation();
      if (originalUser) {
        return; // Return to original user without full logout
      }
    }
    
    // Full logout
    localStorage.removeItem('user_session');
    localStorage.removeItem('current_user');
    localStorage.removeItem('original_user_session');
    localStorage.removeItem('impersonation_active');
    localStorage.removeItem('impersonated_by');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  },

  isLoggedIn: (): boolean => {
    return !!mockApiService.getCurrentUser();
  },

  // Generate unique tablet/session ID for operation ownership
  getTabletId: () => {
    let tabletId = localStorage.getItem('tablet_id');
    if (!tabletId) {
      tabletId = `tablet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('tablet_id', tabletId);
    }
    return tabletId;
  },
  
  // Get operator ID (now uses actual user ID from login)
  getOperatorId: () => {
    const user = mockApiService.getCurrentUser();
    return user ? user.id : mockApiService.getTabletId();
  },

  // Get operator display name
  getOperatorName: (): string => {
    const user = mockApiService.getCurrentUser();
    return user ? user.fullName : 'Anonymous';
  },

  // Sync state management for real-time updates across tablets
  syncListeners: new Set<() => void>(),
  
  // Subscribe to data changes (enables real-time sync notifications)
  onDataChange: (callback: () => void): (() => void) => {
    mockApiService.syncListeners.add(callback);
    return () => {
      mockApiService.syncListeners.delete(callback);
    };
  },
  
  // Notify all listeners of data changes (triggers UI updates)
  notifyDataChange: () => {
    // Reduced logging frequency for sync notifications
    if (mockApiService.syncListeners.size > 0 && (!(window as any)._lastSyncLog || Date.now() - (window as any)._lastSyncLog > 30000)) {
      console.log(`🔔 Notifying ${mockApiService.syncListeners.size} listeners of data change`);
      (window as any)._lastSyncLog = Date.now();
    }
    mockApiService.syncListeners.forEach(callback => callback());
  },
  
  // Enhanced data persistence with cross-browser sync
  saveData: async (key: string, data: any) => {
    // Save to localStorage (immediate local storage)
    localStorage.setItem(key, JSON.stringify(data));
    
    // Reduced logging frequency
    if (!(window as any)._lastSaveLog || Date.now() - (window as any)._lastSaveLog > 10000) {
      console.log(`💾 Data operations: saving "${key}" with ${data.length || 'unknown'} items`);
      (window as any)._lastSaveLog = Date.now();
    }
    
    // Broadcast change to other browsers/tabs
    mockApiService.broadcastChange(key);
    
    // Notify components on this browser of the change
    mockApiService.notifyDataChange();
  },
  
  // Enhanced data loading with sync fallback
  loadData: async (key: string, defaultData: any) => {
    // Try localStorage first (fastest access)
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // TODO: When Firebase is configured:
    // - Try loading from Firebase if localStorage is empty
    // - This ensures new tablets get existing data from other tablets
    
    // Return default data if nothing found anywhere
    return defaultData;
  },

  // Check if current tablet/operator owns this barrel operation
  isCurrentOperator: (barrel: SimpleBarrel): boolean => {
    return barrel.current_operator_id === mockApiService.getOperatorId();
  },
  
  // Get display name for tablet (shortened for UI)
  getTabletDisplayName: (tabletId?: string): string => {
    if (!tabletId) return 'Unknown';
    const parts = tabletId.split('_');
    return `Tablet-${parts[parts.length - 1]?.substr(0, 4) || 'XXX'}`;
  },

  // Check if current user can access a specific station (security validation)
  canUserAccessStation: (stationId: string): boolean => {
    const currentUser = mockApiService.getCurrentUser();
    if (!currentUser) return false;
    
    // Admins and supervisors have access to all stations
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      return true;
    }
    
    // Operators can only access assigned stations
    const assignedStations = mockApiService.getAssignedStations(currentUser.id);
    return assignedStations.includes(stationId);
  },

  getStations: (): SimpleStation[] => [
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
    { id: '11', name: 'Final QC', sequence: 11, description: 'Final quality control' }
  ],

  getBarrels: async (): Promise<SimpleBarrel[]> => {
    // Use sync-aware data loading
    const demoBarrels: SimpleBarrel[] = [
      {
        id: '1',
        caliber: '.308 Winchester',
        length_inches: 24,
        twist_rate: '1:10',
        material: '416R Stainless',
        status: 'DRILLING_PENDING',
        created_at: new Date().toISOString(),
        operation_logs: [],
        priority: 'Medium'
      },
      {
        id: '2',
        caliber: '6.5 Creedmoor',
        length_inches: 26,
        twist_rate: '1:8',
        material: '416R Stainless',
        status: 'DRILLING_PENDING',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        operation_logs: [],
        priority: 'High'
      }
    ];
    
    const barrels = await mockApiService.loadData('barrels', demoBarrels);
    // Reduced logging frequency - only log on data changes or startup
    if (!mockApiService._lastBarrelCheck || Date.now() - mockApiService._lastBarrelCheck > 30000) {
      console.log('📦 getBarrels periodic check:', {
        total: barrels.length,
        activeCount: barrels.filter((b: SimpleBarrel) => b.status.includes('IN_PROGRESS')).length
      });
      mockApiService._lastBarrelCheck = Date.now();
    }
    return barrels;
  },

  createBarrel: async (data: Omit<SimpleBarrel, 'id' | 'created_at' | 'status' | 'operation_logs'>): Promise<SimpleBarrel> => {
    const barrels = await mockApiService.getBarrels();
    const newBarrel: SimpleBarrel = {
      ...data,
      id: Date.now().toString(),
      status: 'DRILLING_PENDING',
      created_at: new Date().toISOString(),
      operation_logs: []
    };
    barrels.push(newBarrel);
    await mockApiService.saveData('barrels', barrels); // Use sync-aware save
    return newBarrel;
  },

  startOperation: async (barrelId: string, stationName: string): Promise<SimpleBarrel> => {
    // Security validation: Check if user has access to this station
    const stations = mockApiService.getStations();
    const targetStation = stations.find(s => s.name === stationName);
    if (targetStation && !mockApiService.canUserAccessStation(targetStation.id)) {
      throw new Error(`Access denied: You are not authorized to operate ${stationName} station. Contact your supervisor for station assignment.`);
    }
    
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (barrel) {
      // Check if barrel is already owned by another operator
      if (barrel.current_operator_id && barrel.current_operator_id !== mockApiService.getOperatorId()) {
        throw new Error(`Barrel is currently being worked on by ${barrel.current_operator_name || 'another operator'} (${barrel.current_tablet_id})`);
      }
      
      const stationStatus = stationName.toUpperCase().replace(' ', '_');
      barrel.status = `${stationStatus}_IN_PROGRESS`;
      console.log('🚀 Starting operation:', {
        barrelId: barrel.id,
        stationName,
        newStatus: barrel.status,
        operatorId: mockApiService.getOperatorId(),
        operatorName: mockApiService.getOperatorName(),
        tabletId: mockApiService.getTabletId()
      });
      barrel.started_at = new Date().toISOString();
      barrel.current_operator_id = mockApiService.getOperatorId();
      barrel.current_operator_name = mockApiService.getOperatorName();
      barrel.current_tablet_id = mockApiService.getTabletId();
      
      // Ensure operation_logs array exists
      if (!barrel.operation_logs) {
        barrel.operation_logs = [];
      }
      
      barrel.operation_logs.push({
        station_name: stationName,
        start_time: new Date().toISOString(),
        end_time: null,
        operator_id: mockApiService.getOperatorId(),
        operator_name: mockApiService.getOperatorName(),
        tablet_id: mockApiService.getTabletId()
      });
      await mockApiService.saveData('barrels', barrels); // Sync across tablets
      
      console.log('✅ Operation started and saved to localStorage:', {
        barrelId: barrel.id,
        newStatus: barrel.status,
        operator: barrel.current_operator_name,
        tabletId: barrel.current_tablet_id
      });
    }
    return barrel!;
  },

  pauseOperation: async (_barrelId: string): Promise<void> => {
    // Mock implementation
  },

  resumeOperation: async (_barrelId: string): Promise<void> => {
    // Mock implementation
  },

  completeOperation: async (barrelId: string, notes?: string): Promise<SimpleBarrel> => {
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (barrel) {
      // Security validation: Check if user has access to the current station
      const stations = mockApiService.getStations();
      const currentStationName = barrel.status.replace(/_IN_PROGRESS$|_PENDING$/, '');
      const currentStation = stations.find(s => s.name.toUpperCase().replace(' ', '_') === currentStationName);
      if (currentStation && !mockApiService.canUserAccessStation(currentStation.id)) {
        throw new Error(`Access denied: You are not authorized to operate ${currentStation.name} station. Contact your supervisor for station assignment.`);
      }
      
      // Security check: Only the operator who started this operation can complete it
      if (barrel.current_operator_id && barrel.current_operator_id !== mockApiService.getOperatorId()) {
        throw new Error(`Only ${barrel.current_operator_name || 'the operator who started this operation'} can complete it (${barrel.current_tablet_id})`);
      }
      
      const nextStation = stations.find(s => s.sequence === (currentStation?.sequence || 0) + 1);
      
      // Update the last operation log
      if (barrel.operation_logs && barrel.operation_logs.length > 0) {
        const lastLog = barrel.operation_logs[barrel.operation_logs.length - 1];
        lastLog.end_time = new Date().toISOString();
        if (notes) {
          lastLog.notes = notes;
        }
      }
      
      barrel.status = nextStation ? `${nextStation.name.toUpperCase().replace(' ', '_')}_PENDING` : 'COMPLETED';
      console.log('✅ Completing operation:', {
        barrelId: barrel.id,
        oldStatus: `${currentStationName}_IN_PROGRESS`,
        newStatus: barrel.status,
        nextStation: nextStation?.name,
        operatorId: mockApiService.getOperatorId(),
        operatorName: mockApiService.getOperatorName()
      });
      barrel.completed_at = barrel.status === 'COMPLETED' ? new Date().toISOString() : undefined;
      barrel.started_at = undefined;
      
      // Release ownership when operation is completed
      barrel.current_operator_id = undefined;
      barrel.current_operator_name = undefined;
      barrel.current_tablet_id = undefined;
      
      await mockApiService.saveData('barrels', barrels); // Sync completion across tablets
    }
    return barrel!;
  },

  getMetrics: async () => {
    const barrels = await mockApiService.getBarrels();
    const stations = mockApiService.getStations();
    
    return {
      total_wip: barrels.filter(b => !b.status.includes('COMPLETED')).length,
      completed_today: barrels.filter(b => b.status === 'COMPLETED').length,
      stations: stations.map(station => {
        const stationStatus = station.name.toUpperCase().replace(' ', '_');
        return {
          station_id: station.id,
          pending_count: barrels.filter(b => b.status === `${stationStatus}_PENDING`).length,
          in_progress_count: barrels.filter(b => b.status === `${stationStatus}_IN_PROGRESS`).length,
          completed_today: 0,
          avg_cycle_time_seconds: 1800
        };
      })
    };
  },

  // Add method to get all barrel process information
  getBarrelProcessInfo: async () => {
    const barrels = await mockApiService.getBarrels();
    const stations = mockApiService.getStations();
    
    return barrels.map(barrel => {
      // Determine current station
      const statusParts = barrel.status.split('_');
      const stationStatus = statusParts.slice(0, -1).join('_');
      const currentStation = stations.find(s => 
        s.name.toUpperCase().replace(' ', '_') === stationStatus
      );
      
      // Calculate progress percentage
      const currentStationIndex = currentStation ? currentStation.sequence : 
        (barrel.status === 'COMPLETED' ? stations.length + 1 : 0);
      const progressPercentage = Math.round((currentStationIndex / (stations.length + 1)) * 100);
      
      return {
        ...barrel,
        currentStation: currentStation?.name || (barrel.status === 'COMPLETED' ? 'Completed' : 'Not Started'),
        currentStationId: currentStation?.id,
        progressPercentage,
        isActive: barrel.status.includes('IN_PROGRESS'),
        operationHistory: barrel.operation_logs || []
      };
    });
  }
};

// --- LOGIN COMPONENT ---
function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const user = await mockApiService.login(values.username, values.password);
      if (user) {
        // Get user's assigned stations
        const assignedStations = mockApiService.getAssignedStations(user.id);
        const stations = mockApiService.getStations();
        
        let stationMessage = '';
        if (user.role === 'admin') {
          stationMessage = 'Administrator access - full system control enabled.';
        } else if (assignedStations.length > 0) {
          const primaryStation = stations.find(s => s.id === assignedStations[0]);
          stationMessage = `Directing you to ${primaryStation?.name} station.`;
        } else {
          stationMessage = 'WARNING: No station assigned - contact administrator for access.';
        }
        
        if (user.role === 'admin' || assignedStations.length > 0) {
          notification.success({ 
            message: 'Login Successful', 
            description: `Welcome back, ${user.fullName}! ${stationMessage}` 
          });
        } else {
          notification.warning({ 
            message: 'Login Successful - Access Limited', 
            description: `Welcome back, ${user.fullName}! ${stationMessage}`,
            duration: 8 // Show warning longer
          });
        }
        
        // Force re-render of parent component
        window.location.reload();
      } else {
        notification.error({ 
          message: 'Login Failed', 
          description: 'Invalid username or password. Please try again.' 
        });
      }
    } catch (error) {
      notification.error({ 
        message: 'Login Error', 
        description: 'An error occurred during login. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const users = mockApiService.getUsers();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24
    }}>
      <Card style={{ 
        width: 400, 
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        borderRadius: 12
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <AppstoreOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1677ff' }}>
            Rifle Barrel MES
          </h1>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>
            Manufacturing Execution System
          </p>
        </div>

        <Form
          layout="vertical"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input 
              prefix={<PlayCircleOutlined />}
              placeholder="Enter username"
              size="large"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<ExclamationCircleOutlined />}
              placeholder="Enter password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              loading={isLoading}
              style={{ fontWeight: 600 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button 
            type="link" 
            onClick={() => setShowUsers(!showUsers)}
            size="small"
          >
            {showUsers ? 'Hide' : 'Show'} Demo Users
          </Button>
        </div>

        {showUsers && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 6,
            fontSize: 12
          }}>
            <strong>Demo Users (password: any 3+ chars):</strong>
            <div style={{ 
              margin: '8px 0 0 0', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '4px' 
            }}>
              {users.filter(u => u.role === 'operator' && u.username !== 'testuser').map((user, index) => {
                const stationNames = ['Drilling', 'Reaming', 'Rifling', 'Heat Treat', 'Lapping', 'Honing', 'Fluting', 'Chambering', 'Inspection', 'Finishing', 'Final QC'];
                const stationName = stationNames[index] || 'Unassigned';
                return (
                  <div key={user.id} style={{ fontSize: 11 }}>
                    <strong>{user.username}</strong> → {stationName}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #ddd' }}>
              <div style={{ fontSize: 11 }}>
                <strong>supervisor</strong> - Sarah Wilson (supervisor)
              </div>
              <div style={{ fontSize: 11 }}>
                <strong>admin</strong> - System Administrator (admin)
              </div>
              <div style={{ fontSize: 11, color: '#ff4d4f' }}>
                <strong>testuser</strong> - Unassigned User (blocked access)
              </div>
            </div>
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          padding: 12,
          background: '#e6f7ff',
          borderRadius: 6,
          fontSize: 11,
          color: '#1677ff'
        }}>
          🔐 Secure operator authentication ensures full traceability
        </div>
      </Card>
    </div>
  );
}

// --- ADMIN PANEL COMPONENT ---
function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [stations] = useState<SimpleStation[]>(mockApiService.getStations());
  const [barrels, setBarrels] = useState<SimpleBarrel[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedBarrelDetails, setSelectedBarrelDetails] = useState<any | null>(null);
  const [newUserForm] = Form.useForm();
  // Firebase config state
  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    const stored = localStorage.getItem('firebase_config');
    return stored ? JSON.parse(stored) : {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: ''
    };
  });
  const [firebaseEnabled, setFirebaseEnabled] = useState(() => {
    const stored = localStorage.getItem('firebase_enabled');
    return stored ? JSON.parse(stored) : false;
  });
  const [firebaseEditMode, setFirebaseEditMode] = useState(false);

  // Save Firebase config to localStorage and update state
  const handleFirebaseConfigSave = (values: any) => {
    setFirebaseConfig(values);
    localStorage.setItem('firebase_config', JSON.stringify(values));
    setFirebaseEditMode(false);
  };
  // Toggle Firebase sync
  const handleFirebaseToggle = (enabled: boolean) => {
    setFirebaseEnabled(enabled);
    localStorage.setItem('firebase_enabled', JSON.stringify(enabled));
    // Optionally reload or re-init sync here
    window.location.reload();
  };

  const loadAdminData = useCallback(async () => {
    // Reduced logging frequency for admin data loads
    if (!(window as any)._lastAdminLoadLog || Date.now() - (window as any)._lastAdminLoadLog > 60000) {
      console.log('📊 loadAdminData called in admin panel');
      (window as any)._lastAdminLoadLog = Date.now();
    }
    setIsLoading(true);
    try {
      console.log('🔄 Starting admin data load...');
      
      // Force check for corrupted data by calling getUsers first
      const allUsers = mockApiService.getUsers();
      console.log('👥 Users loaded:', allUsers.length);
      
      // Filter users based on current user's role
      const currentUser = mockApiService.getCurrentUser();
      let usersData = allUsers;
      
      if (currentUser?.role === 'supervisor') {
        // Supervisors can only see operators and themselves
        usersData = allUsers.filter(user => 
          user.role === 'operator' || user.id === currentUser.id
        );
      }
      // Admins can see all users (no filtering needed)
      
      const [analyticsData, barrelsData] = await Promise.all([
        mockApiService.getSystemAnalytics(),
        mockApiService.getBarrels()
      ]);
      
      console.log('📊 Analytics data:', analyticsData);
      console.log('🏭 Barrels data:', barrelsData.length);
      
      console.log('📊 Admin data loaded:', {
        users: usersData.length,
        barrels: barrelsData.length,
        activeBarrels: barrelsData.filter(b => b.status.includes('IN_PROGRESS')).length,
        barrelStatuses: barrelsData.map(b => ({ id: b.id, status: b.status })),
        analytics: analyticsData
      });
      
      setUsers(usersData);
      setAnalytics(analyticsData);
      setBarrels(barrelsData);
      
      console.log('✅ Admin data state updated successfully');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      notification.error({ 
        message: 'Error loading admin data', 
        description: String(error) 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load data immediately on mount
    loadAdminData();
  }, [loadAdminData]);

  // Add real-time sync for admin panel
  useEffect(() => {
    const unsubscribe = mockApiService.onDataChange(() => {
      loadAdminData();
    });
    return unsubscribe;
  }, [loadAdminData]);

  // Add polling for admin panel - reduced frequency for better performance
  useEffect(() => {
    const interval = setInterval(() => { loadAdminData(); }, 15000); // Reduced from 5s to 15s
    return () => clearInterval(interval);
  }, [loadAdminData]);

  const handleCreateUser = async (values: any) => {
    try {
      await mockApiService.createUser(values);
      notification.success({ message: 'User created successfully!' });
      setShowUserForm(false);
      newUserForm.resetFields();
      loadAdminData();
    } catch (error) {
      notification.error({ message: 'Failed to create user' });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await mockApiService.updateUser(userId, updates);
      notification.success({ message: 'User updated successfully!' });
      setEditingUser(null);
      loadAdminData();
    } catch (error) {
      notification.error({ message: 'Failed to update user' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user? This action cannot be undone.',
      onOk: async () => {
        try {
          await mockApiService.deleteUser(userId);
          notification.success({ message: 'User deleted successfully!' });
          loadAdminData();
        } catch (error) {
          notification.error({ message: 'Failed to delete user' });
        }
      }
    });
  };

  const handleImpersonateUser = async (user: User) => {
    try {
      Modal.confirm({
        title: 'Impersonate User',
        content: (
          <div>
            <p>You are about to impersonate:</p>
            <p><strong>{user.fullName}</strong> ({user.username})</p>
            <p style={{ color: '#fa8c16', marginTop: 12 }}>
              ⚠️ You will see the system from their perspective. 
              Use the "Stop Impersonation" button to return to your admin account.
            </p>
          </div>
        ),
        okText: 'Start Impersonation',
        cancelText: 'Cancel',
        okType: 'primary',
        zIndex: 9999,
        maskClosable: false,
        keyboard: true,
        centered: true,
        width: 500,
        onOk: async () => {
          try {
            await mockApiService.impersonateUser(user.id);
            notification.success({ 
              message: 'Impersonation Started',
              description: `You are now logged in as ${user.fullName}. Click "Stop Impersonation" to return.`,
              duration: 6
            });
            // Reload the page to show the user's perspective
            window.location.reload();
          } catch (error) {
            notification.error({ 
              message: 'Impersonation Failed', 
              description: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      });
    } catch (error) {
      notification.error({ 
        message: 'Impersonation Error', 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const handleStationAssignment = async (userId: string, stationId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await mockApiService.assignUserToStation(userId, stationId);
        notification.success({ message: 'Station assigned successfully!' });
      } else {
        await mockApiService.removeStationAssignment(userId, stationId);
        notification.success({ message: 'Station assignment removed!' });
      }
      
      // Force immediate reload and sync
      loadAdminData();
      mockApiService.broadcastChange('station_assignments');
      
    } catch (error) {
      notification.error({ message: 'Failed to update station assignment' });
    }
  };

  const handleDirectStationAssignment = async (stationId: string, userId: string | null) => {
    try {
      // First, remove any existing assignment for this station
      const currentOperator = mockApiService.getStationOperator(stationId);
      if (currentOperator) {
        await mockApiService.removeStationAssignment(currentOperator.id, stationId);
      }
      
      // Then assign new user if provided
      if (userId) {
        await mockApiService.assignUserToStation(userId, stationId);
        const user = users.find(u => u.id === userId);
        notification.success({ 
          message: 'Station assignment updated!', 
          description: `${user?.fullName} assigned to station ${stationId}` 
        });
      } else {
        notification.success({ 
          message: 'Station assignment cleared!', 
          description: `Station ${stationId} is now unassigned` 
        });
      }
      
      loadAdminData();
    } catch (error) {
      notification.error({ message: 'Failed to update station assignment' });
    }
  };

  const userColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role: string) => (
        <span style={{ 
          color: role === 'admin' ? '#f5222d' : role === 'supervisor' ? '#faad14' : '#52c41a',
          fontWeight: 600 
        }}>
          {role.toUpperCase()}
        </span>
      )
    },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { 
      title: 'Status', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? '#52c41a' : '#f5222d' }}>
          {isActive ? '✅ Active' : '❌ Inactive'}
        </span>
      )
    },
    { 
      title: 'Created', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: (date: string) => new Date(date).toLocaleDateString() 
    },
    {
      title: 'Assigned Stations',
      key: 'assignedStations',
      render: (_: any, record: User) => {
        const userStations = mockApiService.getAssignedStations(record.id);
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {stations.map(station => {
              const isAssigned = userStations.includes(station.id);
              return (
                <Button
                  key={station.id}
                  size="small"
                  type={isAssigned ? 'primary' : 'default'}
                  onClick={async () => {
                    const button = document.querySelector(`[data-station="${station.id}-${record.id}"]`) as HTMLButtonElement;
                    if (button) button.style.opacity = '0.5';
                    
                    await handleStationAssignment(record.id, station.id, !isAssigned);
                    
                    if (button) button.style.opacity = '1';
                  }}
                  style={{ marginBottom: 4 }}
                  data-station={`${station.id}-${record.id}`}
                >
                  {station.name}
                </Button>
              );
            })}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => {
        const currentUser = mockApiService.getCurrentUser();
        const canImpersonate = currentUser && 
          (currentUser.role === 'admin' || currentUser.role === 'supervisor') &&
          record.id !== currentUser.id; // Can't impersonate yourself
        
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="small"
              onClick={() => setEditingUser(record)}
            >
              Edit
            </Button>
            {canImpersonate && (
              <Button
                size="small"
                type="primary"
                onClick={() => handleImpersonateUser(record)}
                style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
              >
                Login As
              </Button>
            )}
            <Button
              size="small"
              danger
              onClick={() => handleDeleteUser(record.id)}
              disabled={record.username === 'admin'}
            >
              Delete
            </Button>
          </div>
        );
      }
    }
  ];

  const stationColumns = [
    { title: 'Station', dataIndex: 'name', key: 'name' },
    { title: 'Sequence', dataIndex: 'sequence', key: 'sequence' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Assigned Operator',
      key: 'assignedOperator',
      render: (_: any, record: SimpleStation) => {
        const operator = mockApiService.getStationOperator(record.id);
        return operator ? (
          <span style={{ color: '#52c41a', fontWeight: 600 }}>
            👤 {operator.fullName} ({operator.username})
          </span>
        ) : (
          <span style={{ color: '#999' }}>Unassigned</span>
        );
      }
    },
    {
      title: 'Change Assignment',
      key: 'actions',
      width: 220,
      render: (_: any, record: SimpleStation) => {
        const currentOperator = mockApiService.getStationOperator(record.id);
        const availableUsers = users.filter(u => u.isActive && (u.role === 'operator' || u.role === 'supervisor'));
        
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              key={`station-${record.id}-${users.length}`} // Force re-render when users change
              style={{ width: 200 }}
              placeholder="Select operator"
              value={currentOperator?.id || null}
              onChange={(userId) => handleDirectStationAssignment(record.id, userId)}
              allowClear
              onClear={() => handleDirectStationAssignment(record.id, null)}
              showSearch
              filterOption={(input, option) => {
                const label = option?.label || option?.children;
                return String(label).toLowerCase().includes(input.toLowerCase());
              }}
            >
              {availableUsers.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.fullName} ({user.username})
                </Select.Option>
              ))}
            </Select>
          </div>
        );
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#722ed1', 
        color: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 16 }}>
          <AppstoreOutlined />
          Admin Panel
          {mockApiService.getCurrentUser()?.role === 'supervisor' && (
            <span style={{ 
              fontSize: 12, 
              fontWeight: 400, 
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: 4
            }}>
              Supervisor View - Operators Only
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Impersonation indicator */}
          {mockApiService.isImpersonating() && (
            <div style={{
              background: '#fa8c16',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              🎭 IMPERSONATING: {mockApiService.getCurrentUser()?.fullName}
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const originalUser = await mockApiService.stopImpersonation();
                    if (originalUser) {
                      notification.success({
                        message: 'Impersonation Stopped',
                        description: `Returned to ${originalUser.fullName} account.`
                      });
                      window.location.reload();
                    }
                  } catch (error) {
                    notification.error({ message: 'Failed to stop impersonation' });
                  }
                }}
                style={{
                  background: '#fff',
                  color: '#fa8c16',
                  border: 'none',
                  height: 20,
                  fontSize: 10,
                  padding: '0 8px'
                }}
              >
                STOP
              </Button>
            </div>
          )}
          
          {/* User information */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13
          }}>
            <span>👤</span>
            <span style={{ fontWeight: 600 }}>
              {mockApiService.getCurrentUser()?.fullName || 'Anonymous'}
            </span>
            <span style={{ opacity: 0.7 }}>
              ({mockApiService.getCurrentUser()?.role || 'guest'})
            </span>
            {mockApiService.isImpersonating() && (
              <span style={{ color: '#ffd666', fontSize: 11 }}>
                [Original: {mockApiService.getOriginalUser()?.fullName}]
              </span>
            )}
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAdminData} 
            loading={isLoading} 
            type="primary"
            ghost
          >
            Refresh
          </Button>
          <Button 
            onClick={() => {
              if (window.confirm('Reset all data to defaults? This will clear localStorage.')) {
                localStorage.removeItem('users');
                localStorage.removeItem('station_assignments');
                localStorage.removeItem('barrels');
                window.location.reload();
              }
            }}
            type="primary"
            ghost
            danger
          >
            Reset Data
          </Button>
          <Button 
            icon={<ExclamationCircleOutlined />} 
            onClick={async () => {
              if (window.confirm('Are you sure you want to log out?')) {
                await mockApiService.logout();
                notification.info({ message: 'Logged out successfully' });
                window.location.reload();
              }
            }}
            type="primary"
            ghost
          >
            Logout
          </Button>
        </div>
      </Header>

      {/* --- Firebase Config Section --- */}
      <Content style={{ margin: 24 }}>
        <Card style={{ marginBottom: 24, background: '#fffbe6', border: '1px solid #ffe58f' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Cloud Sync (Firebase)</div>
              <div style={{ fontSize: 13, color: '#ad8b00' }}>
                {firebaseEnabled ? '✅ Connected to Firebase (cloud sync enabled)' : '❌ Not connected (local-only mode)'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type={firebaseEnabled ? 'default' : 'primary'}
                onClick={() => handleFirebaseToggle(!firebaseEnabled)}
                style={firebaseEnabled ? { background: '#fff', color: '#faad14', borderColor: '#faad14' } : { background: '#faad14', borderColor: '#faad14', color: '#fff' }}
              >
                {firebaseEnabled ? 'Disable Sync' : 'Enable Sync'}
              </Button>
              <Button
                onClick={() => setFirebaseEditMode(!firebaseEditMode)}
                type="default"
              >
                {firebaseEditMode ? 'Cancel' : 'Edit Config'}
              </Button>
            </div>
          </div>
          {firebaseEditMode && (
            <Form
              layout="vertical"
              initialValues={firebaseConfig}
              onFinish={handleFirebaseConfigSave}
              style={{ marginTop: 16, maxWidth: 500 }}
            >
              <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: 'Required' }]}> <Input /> </Form.Item>
              <Form.Item label="Auth Domain" name="authDomain" rules={[{ required: true, message: 'Required' }]}> <Input /> </Form.Item>
              <Form.Item label="Database URL" name="databaseURL" rules={[{ required: true, message: 'Required' }]}> <Input /> </Form.Item>
              <Form.Item label="Project ID" name="projectId" rules={[{ required: true, message: 'Required' }]}> <Input /> </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">Save Config</Button>
              </Form.Item>
            </Form>
          )}
        </Card>
        
        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <Card style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ fontSize: 12, color: '#52c41a' }}>
              Debug: Users: {users.length}, 
              Analytics: {analytics ? 'loaded' : 'loading'}, 
              Barrels: {barrels.length},
              Loading: {isLoading.toString()}
            </div>
          </Card>
        )}
        
        {/* Analytics Overview */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Total Users" 
                value={analytics?.totalUsers || users.length || 0} 
                prefix={<PlayCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Active Users" 
                value={analytics?.activeUsers || users.filter(u => u.isActive).length || 0} 
                prefix={<CheckCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Active Operators" 
                value={analytics?.activeOperators || users.filter(u => u.isActive && u.role === 'operator').length || 0} 
                prefix={<ClockCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Assigned Stations" 
                value={analytics?.assignedStations || 0} 
                prefix={<BarChartOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Total Operations" 
                value={analytics?.totalOperations || 0} 
                prefix={<AppstoreOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              block 
              size="large" 
              onClick={() => setShowUserForm(true)}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              Add User
            </Button>
          </Col>
        </Row>

        {/* Tab Navigation */}
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space.Compact>
              <Button 
                type={activeTab === 'users' ? 'primary' : 'default'}
                onClick={() => setActiveTab('users')}
                style={activeTab === 'users' ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
              >
                User Management
              </Button>
              <Button 
                type={activeTab === 'stations' ? 'primary' : 'default'}
                onClick={() => setActiveTab('stations')}
                style={activeTab === 'stations' ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
              >
                Station Assignments
              </Button>
              <Button 
                type={activeTab === 'tracking' ? 'primary' : 'default'}
                onClick={() => setActiveTab('tracking')}
                style={activeTab === 'tracking' ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
              >
                Barrel Tracking
              </Button>
              <Button 
                type={activeTab === 'activity' ? 'primary' : 'default'}
                onClick={() => setActiveTab('activity')}
                style={activeTab === 'activity' ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
              >
                Recent Activity
              </Button>
              <Button 
                type={activeTab === 'operations' ? 'primary' : 'default'}
                onClick={() => setActiveTab('operations')}
                style={activeTab === 'operations' ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
              >
                Active Operations
              </Button>
            </Space.Compact>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {mockApiService.getCurrentUser()?.role === 'supervisor' && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 12, 
                  background: '#fff7e6', 
                  border: '1px solid #ffd591',
                  borderRadius: 6,
                  fontSize: 13
                }}>
                  <strong>📋 Supervisor View:</strong> You can only see and impersonate operator accounts. 
                  Admins and other supervisors are hidden for security.
                </div>
              )}
              <Table
                dataSource={users}
                columns={userColumns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </div>
          )}

          {/* Stations Tab */}
          {activeTab === 'stations' && (
            <div>
              <div style={{ 
                marginBottom: 16, 
                padding: 16, 
                background: '#f0f2ff', 
                borderRadius: 8,
                border: '1px solid #d6e4ff'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#1677ff' }}>
                  📍 Station Assignment Management
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  Use the dropdown menus to assign operators to stations. Changes are saved automatically.
                  Only active operators and supervisors can be assigned to stations.
                </div>
              </div>
              
              <Table
                dataSource={stations}
                columns={stationColumns}
                rowKey="id"
                loading={isLoading}
                pagination={false}
              />
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div>
              <h3>Recent Manufacturing Activity</h3>
              {analytics?.recentActivity?.map((activity: any, index: number) => (
                <Card key={index} style={{ marginBottom: 8 }} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{activity.operator_name}</strong> - {activity.station_name}
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {new Date(activity.start_time).toLocaleString()}
                    </div>
                  </div>
                </Card>
              )) || <p>No recent activity</p>}
            </div>
          )}

          {/* Active Operations Tab */}
          {activeTab === 'operations' && (
            <div>
              <h3>🔥 Currently Active Operations</h3>
              <div style={{ marginBottom: 16 }}>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered in admin panel');
                    loadAdminData();
                  }}
                  type="primary"
                  size="small"
                >
                  Refresh Now
                </Button>
                <span style={{ marginLeft: 16, fontSize: 12, color: '#666' }}>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
              {(() => {
                const activeBarrels = barrels.filter(b => b.status.includes('IN_PROGRESS'));
                // Reduced debug logging frequency
                if (!(window as any)._lastActiveOpsLog || Date.now() - (window as any)._lastActiveOpsLog > 30000) {
                  console.log('🔍 Active Operations Debug:');
                  console.log('📊 Total barrels:', barrels.length);
                  console.log('🔥 Active barrels:', activeBarrels.length);
                  console.log('📋 All barrel statuses:', barrels.map(b => ({ id: b.id, status: b.status, operator: b.current_operator_name })));
                  console.log('⚡ Active barrel details:', activeBarrels);
                  (window as any)._lastActiveOpsLog = Date.now();
                }
                return activeBarrels.length > 0;
              })() ? (
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  {barrels
                    .filter(b => b.status.includes('IN_PROGRESS'))
                    .map(barrel => {
                      const stationName = barrel.status.replace('_IN_PROGRESS', '').replace(/_/g, ' ');
                      const station = stations.find(s => s.name.toUpperCase() === stationName);
                      
                      return (
                        <Col span={8} key={barrel.id}>
                          <Card 
                            size="small"
                            style={{ 
                              border: '2px solid #722ed1',
                              backgroundColor: '#f9f0ff'
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: 18, 
                                fontWeight: 'bold',
                                color: '#722ed1',
                                marginBottom: 12
                              }}>
                                🔧 {station?.name || stationName}
                              </div>
                              <div style={{ fontSize: 16, marginBottom: 8 }}>
                                <strong>Barrel #{barrel.id}</strong>
                              </div>
                              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                                <strong>{barrel.caliber}</strong><br/>
                                {barrel.length_inches}" • {barrel.twist_rate}<br/>
                                {barrel.material}<br/>
                                Priority: <span style={{ 
                                  color: barrel.priority === 'High' ? '#f5222d' : barrel.priority === 'Medium' ? '#faad14' : '#52c41a',
                                  fontWeight: 600 
                                }}>
                                  {barrel.priority}
                                </span>
                              </div>
                              <div style={{ 
                                fontSize: 14, 
                                marginBottom: 8,
                                padding: '4px 8px',
                                borderRadius: 4,
                                background: '#f0f5ff'
                              }}>
                                <span style={{ 
                                  color: '#722ed1',
                                  fontWeight: 600 
                                }}>
                                  👥 {barrel.current_operator_name || 'Unknown Operator'}
                                </span>
                              </div>
                              <div style={{ 
                                fontSize: 12, 
                                color: '#999',
                                background: '#f0f0f0',
                                padding: '4px 8px',
                                borderRadius: 4,
                                display: 'inline-block'
                              }}>
                                Started: {barrel.started_at ? new Date(barrel.started_at).toLocaleString() : 'Unknown'}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                </Row>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  color: '#999',
                  background: '#fafafa',
                  borderRadius: 8,
                  marginTop: 16
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⏸️</div>
                  <h3>No Active Operations</h3>
                  <p>All stations are currently idle. Operations will appear here when started.</p>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#666', 
                    marginTop: 16,
                    padding: 12,
                    background: '#e6f4ff',
                    borderRadius: 4,
                    border: '1px solid #91d5ff'
                  }}>
                    💡 <strong>How to test:</strong> Open another browser tab, log in as "drill_op" or "ream_op", 
                    and start a drilling operation. This panel should update automatically via cross-tab sync.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add new Barrel Tracking Tab */}
          {activeTab === 'tracking' && (
            <div>
              <h3>📊 Barrel Process Tracking</h3>
              <div style={{ marginBottom: 16 }}>
                <span style={{ color: '#666' }}>
                  Real-time view of all barrels in the manufacturing process
                </span>
              </div>
              <Table
                dataSource={barrels}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: 'Barrel ID', dataIndex: 'id', key: 'id', width: 80 },
                  { title: 'Caliber', dataIndex: 'caliber', key: 'caliber' },
                  { 
                    title: 'Specifications', 
                    key: 'specs',
                    render: (_, record) => (
                      <span style={{ fontSize: 12 }}>
                        {record.length_inches}" • {record.twist_rate} • {record.material}
                      </span>
                    )
                  },
                  { 
                    title: 'Priority', 
                    dataIndex: 'priority', 
                    key: 'priority',
                    render: (p: string) => (
                      <span style={{ 
                        fontWeight: 600,
                        color: p === 'High' ? '#f5222d' : p === 'Medium' ? '#faad14' : '#52c41a'
                      }}>
                        {p}
                      </span>
                    )
                  },
                  { 
                    title: 'Current Station', 
                    key: 'currentStation',
                    render: (_, record) => {
                      const statusParts = record.status.split('_');
                      const isInProgress = record.status.includes('IN_PROGRESS');
                      const stationStatus = statusParts.slice(0, -1).join('_');
                      const station = stations.find(s => 
                        s.name.toUpperCase().replace(' ', '_') === stationStatus
                      );
                      
                      if (record.status === 'COMPLETED') {
                        return <span style={{ color: '#52c41a', fontWeight: 600 }}>✅ Completed</span>;
                      }
                      
                      return (
                        <div>
                          <span style={{ fontWeight: 600 }}>
                            {station?.name || 'Unknown'}
                          </span>
                          {isInProgress && (
                            <span style={{ 
                              marginLeft: 8,
                              color: '#1677ff',
                              fontSize: 11,
                              background: '#e6f7ff',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              IN PROGRESS
                            </span>
                          )}
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Progress', 
                    key: 'progress',
                    render: (_, record) => {
                      const statusParts = record.status.split('_');
                      const stationStatus = statusParts.slice(0, -1).join('_');
                      const currentStation = stations.find(s => 
                        s.name.toUpperCase().replace(' ', '_') === stationStatus
                      );
                      
                      const currentStationIndex = currentStation ? currentStation.sequence : 
                        (record.status === 'COMPLETED' ? stations.length + 1 : 0);
                      const progressPercentage = Math.round((currentStationIndex / (stations.length + 1)) * 100);
                      
                      return (
                        <div style={{ width: 100 }}>
                          <div style={{ 
                            background: '#f0f0f0', 
                            borderRadius: 4, 
                            overflow: 'hidden',
                            height: 8
                          }}>
                            <div style={{ 
                              background: record.status === 'COMPLETED' ? '#52c41a' : '#1677ff', 
                              width: `${progressPercentage}%`,
                              height: '100%',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <div style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                            {progressPercentage}%
                          </div>
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Operator', 
                    dataIndex: 'current_operator_name',
                    key: 'operator',
                    render: (name: string) => name ? (
                      <span style={{ color: '#1677ff' }}>👤 {name}</span>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )
                  },
                  {
                    title: 'View',
                    key: 'actions',
                    render: (_: any, record: any) => (
                      <Button 
                        size="small"
                        onClick={() => setSelectedBarrelDetails(record)}
                      >
                        Details
                      </Button>
                    )
                  }
                ]}
              />
            </div>
          )}
        </Card>

        {/* New User Modal */}
        <Modal
          title="Create New User"
          open={showUserForm}
          onCancel={() => setShowUserForm(false)}
          footer={null}
          width={600}
        >
          <Form 
            form={newUserForm}
            layout="vertical" 
            onFinish={handleCreateUser}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                  <Input placeholder="Enter username" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="operator">Operator</Select.Option>
                    <Select.Option value="supervisor">Supervisor</Select.Option>
                    <Select.Option value="admin">Admin</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="Manufacturing">Manufacturing</Select.Option>
                    <Select.Option value="Quality Control">Quality Control</Select.Option>
                    <Select.Option value="Engineering">Engineering</Select.Option>
                    <Select.Option value="IT">IT</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="Status" name="isActive" initialValue={true}>
              <Select>
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowUserForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                >
                  Create User
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          title="Edit User"
          open={!!editingUser}
          onCancel={() => setEditingUser(null)}
          footer={null}
          width={600}
        >
          {editingUser && (
            <Form 
              layout="vertical" 
              initialValues={editingUser}
              onFinish={(values) => handleUpdateUser(editingUser.id, values)}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Username" name="username" rules={[{ required: true }]}>
                    <Input placeholder="Enter username" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
                    <Input placeholder="Enter full name" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="operator">Operator</Select.Option>
                      <Select.Option value="supervisor">Supervisor</Select.Option>
                      <Select.Option value="admin">Admin</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value="Manufacturing">Manufacturing</Select.Option>
                      <Select.Option value="Quality Control">Quality Control</Select.Option>
                      <Select.Option value="Engineering">Engineering</Select.Option>
                      <Select.Option value="IT">IT</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item label="Status" name="isActive">
                <Select>
                  <Select.Option value={true}>Active</Select.Option>
                  <Select.Option value={false}>Inactive</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    style={{ background: '#722ed1', borderColor: '#722ed1' }}
                  >
                    Update User
                  </Button>
                </div>
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* Barrel Details Modal */}
        <Modal
          title={selectedBarrelDetails ? `Barrel #${selectedBarrelDetails.id} Details` : 'Barrel Details'}
          open={selectedBarrelDetails !== null}
          onCancel={() => setSelectedBarrelDetails(null)}
          footer={[
            <Button key="close" onClick={() => setSelectedBarrelDetails(null)}>
              Close
            </Button>
          ]}
          width={600}
        >
          {selectedBarrelDetails && (
            <div>
              <Card size="small" style={{ marginBottom: 16 }}>
                <div><strong>Specifications:</strong></div>
                <div>
                  {selectedBarrelDetails.caliber} • {selectedBarrelDetails.length_inches}" • {selectedBarrelDetails.twist_rate}
                </div>
                <div>{selectedBarrelDetails.material}</div>
              </Card>
              
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Operation History:</div>
              {selectedBarrelDetails.operationHistory && selectedBarrelDetails.operationHistory.length > 0 ? (
                selectedBarrelDetails.operationHistory.map((log: any, index: number) => (
                  <Card key={index} size="small" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{log.station_name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Operator: {log.operator_name}<br/>
                      Started: {new Date(log.start_time).toLocaleString()}<br/>
                      {log.end_time && `Completed: ${new Date(log.end_time).toLocaleString()}`}
                      {log.notes && <><br/>Notes: {log.notes}</>}
                    </div>
                  </Card>
                ))
              ) : (
                <p>No operation history available</p>
              )}
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

// --- MAIN APP COMPONENT ---
const { Header, Content, Sider } = Layout;

function AppContent({ onShowAdminPanel }: { onShowAdminPanel?: () => void }) {
  // Initialize cross-tab sync on app startup
  useEffect(() => {
    mockApiService.initSync();
  }, []);
  const [currentUser] = useState<User | null>(mockApiService.getCurrentUser());
  const [showBarrelTracking, setShowBarrelTracking] = useState(false);
  const [barrelTrackingData, setBarrelTrackingData] = useState<any[]>([]);
  const [selectedBarrelDetails, setSelectedBarrelDetails] = useState<any | null>(null);
  
  // QC Dashboard state
  const [showQCDashboard, setShowQCDashboard] = useState(false);
  const [qcStats, setQCStats] = useState<any>(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionBarrel, setInspectionBarrel] = useState<SimpleBarrel | null>(null);
  const [holdModalVisible, setHoldModalVisible] = useState(false);
  const [holdBarrel, setHoldBarrel] = useState<SimpleBarrel | null>(null);
  const [holdReason, setHoldReason] = useState('');
  
  // Security function to check if current user can access a specific station
  const canAccessStation = (stationId: string): boolean => {
    if (!currentUser) return false;
    
    // Admins and supervisors have access to all stations
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      return true;
    }
    
    // Operators can only access assigned stations
    const assignedStations = mockApiService.getAssignedStations(currentUser.id);
    return assignedStations.includes(stationId);
  };
  
  // Get list of stations the current user can access
  const getAccessibleStations = (): SimpleStation[] => {
    if (!currentUser) return [];
    
    // Admins and supervisors see all stations
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      return mockApiService.getStations();
    }
    
    // Operators only see assigned stations
    const assignedStations = mockApiService.getAssignedStations(currentUser.id);
    return mockApiService.getStations().filter(station => 
      assignedStations.includes(station.id)
    );
  };
  
  // Determine user's assigned station or return null if unassigned (admins have full access)
  const getUserAssignedStation = () => {
    if (!currentUser) return null;
    
    // Admins have access to all stations - default to first station
    if (currentUser.role === 'admin') {
      return '1'; // Default to first station for admins
    }
    
    const assignedStations = mockApiService.getAssignedStations(currentUser.id);
    
    if (assignedStations.length > 0) {
      return assignedStations[0]; // Use first assigned station
    }
    
    // If no assigned stations, return null to block access (non-admin users only)
    return null;
  };
  
  const assignedStation = getUserAssignedStation();
  const accessibleStations = getAccessibleStations();
  
  // Reduced debug logging frequency
  if (!(window as any)._lastUserAccessLog || Date.now() - (window as any)._lastUserAccessLog > 60000) {
    console.log('🔍 User Access Debug:', {
      currentUser: currentUser?.username,
      role: currentUser?.role,
      assignedStation,
      accessibleStations: accessibleStations.map(s => s.name),
      accessibleCount: accessibleStations.length
    });
    (window as any)._lastUserAccessLog = Date.now();
  }
  
  const [selectedStation, setSelectedStation] = useState<string>(assignedStation || (accessibleStations[0]?.id || '1'));
  const [barrels, setBarrels] = useState<SimpleBarrel[]>([]);
  const [stations] = useState<SimpleStation[]>(mockApiService.getStations());
  const [activeBarrel, setActiveBarrel] = useState<string | null>(null);
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [showNewBarrelForm, setShowNewBarrelForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [operationNotes, setOperationNotes] = useState('');
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [newBarrel, setNewBarrel] = useState({
    caliber: '.308 Winchester',
    length_inches: 24,
    twist_rate: '1:10',
    material: '416R Stainless',
    priority: 'Medium' as 'High' | 'Medium' | 'Low'
  });

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await mockApiService.logout();
      notification.info({ message: 'Logged out successfully' });
      window.location.reload();
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [barrelsData, metricsData, trackingData, qcStatsData] = await Promise.all([
        mockApiService.getBarrels(),
        mockApiService.getMetrics(),
        mockApiService.getBarrelProcessInfo(),
        mockApiService.getQCStats()
      ]);
      setBarrels(barrelsData);
      setMetrics(metricsData);
      setBarrelTrackingData(trackingData);
      setQCStats(qcStatsData);
      setLastSync(new Date()); // Update sync timestamp
    } catch (error) {
      notification.error({ message: 'Error loading data', description: 'Please check the connection.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  
  // Subscribe to real-time data changes for multi-tablet sync
  useEffect(() => {
    const unsubscribe = mockApiService.onDataChange(() => {
      // When data changes on any tablet, refresh this tablet's display
      loadData();
    });
    return unsubscribe;
  }, [loadData]);
  
  useEffect(() => {
    // More frequent polling for better real-time sync
    const interval = setInterval(() => { loadData(); }, 5000); // 5 seconds instead of 30
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOperationActive) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOperationActive]);

  const getBarrelsForStation = useCallback(() => {
    const station = stations.find(s => s.id === selectedStation);
    if (!station) return [];
    const stationStatus = station.name.toUpperCase().replace(' ', '_');
    const filteredBarrels = barrels.filter(b =>
      b.status === `${stationStatus}_PENDING` ||
      b.status === `${stationStatus}_IN_PROGRESS`
    );
    return filteredBarrels.sort((a, b) => {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [selectedStation, barrels, stations]);

  const handleStartOperation = async (barrelId: string) => {
    const station = stations.find(s => s.id === selectedStation);
    if (!station) return;

    // Security check: Verify user has access to this station
    if (!canAccessStation(selectedStation)) {
      notification.error({ 
        message: 'Access Denied', 
        description: `You are not authorized to operate ${station.name} station. Please contact your supervisor.` 
      });
      return;
    }

    try {
      setIsLoading(true);
      await mockApiService.startOperation(barrelId, station.name);
      
      setActiveBarrel(barrelId);
      setIsOperationActive(true);
      setElapsedTime(0);
      setOperationNotes('');
      setShowNotesSection(false);
      
      notification.success({ message: `Started ${station.name} for Barrel #${barrelId}` });
      await loadData();
    } catch (error: any) {
      notification.error({ 
        message: 'Failed to start operation', 
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseOperation = async () => {
    if (!activeBarrel) return;
    
    // Security check: Verify ownership
    const currentBarrel = barrels.find(b => b.id === activeBarrel);
    if (!currentBarrel || !mockApiService.isCurrentOperator(currentBarrel)) {
      notification.error({ 
        message: 'Access Denied', 
        description: 'You can only control operations that you started.' 
      });
      return;
    }
    
    try {
      await mockApiService.pauseOperation(activeBarrel);
      setIsOperationActive(false);
      notification.info({ message: 'Operation paused.' });
    } catch (error) {
      notification.error({ message: 'Failed to pause operation.' });
    }
  };

  const handleResumeOperation = async (barrelId?: string) => {
    const targetBarrel = barrelId || activeBarrel;
    if (!targetBarrel) return;
    
    // Security check: Verify ownership
    const currentBarrel = barrels.find(b => b.id === targetBarrel);
    if (!currentBarrel || !mockApiService.isCurrentOperator(currentBarrel)) {
      notification.error({ 
        message: 'Access Denied', 
        description: 'You can only control operations that you started.' 
      });
      return;
    }
    
    try {
      await mockApiService.resumeOperation(targetBarrel);
      setActiveBarrel(targetBarrel);
      setIsOperationActive(true);
      notification.info({ message: 'Operation resumed.' });
    } catch (error) {
      notification.error({ message: 'Failed to resume operation.' });
    }
  };

  const handleCompleteOperation = async (barrelId: string) => {
    // Security check: Verify ownership
    const currentBarrel = barrels.find(b => b.id === barrelId);
    if (!currentBarrel || !mockApiService.isCurrentOperator(currentBarrel)) {
      notification.error({ 
        message: 'Access Denied', 
        description: 'You can only complete operations that you started.' 
      });
      return;
    }
    
    // Security check: Verify user has access to this station
    if (!canAccessStation(selectedStation)) {
      notification.error({ 
        message: 'Access Denied', 
        description: 'You are not authorized to operate this station. Please contact your supervisor.' 
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const notes = showNotesSection && operationNotes.trim() ? operationNotes.trim() : undefined;
      await mockApiService.completeOperation(barrelId, notes);
      
      setActiveBarrel(null);
      setIsOperationActive(false);
      setElapsedTime(0);
      setOperationNotes('');
      setShowNotesSection(false);
      
      notification.success({ message: 'Operation completed successfully!' });
      await loadData();
    } catch (error: any) {
      notification.error({ 
        message: 'Failed to complete operation', 
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopOperation = () => {
    if (!activeBarrel) return;
    
    // Security check: Verify ownership
    const currentBarrel = barrels.find(b => b.id === activeBarrel);
    if (!currentBarrel || !mockApiService.isCurrentOperator(currentBarrel)) {
      notification.error({ 
        message: 'Access Denied', 
        description: 'You can only stop operations that you started.' 
      });
      return;
    }
    
    if (window.confirm('Are you sure you want to stop this operation? This is for emergencies and cannot be undone.')) {
      setActiveBarrel(null);
      setIsOperationActive(false);
      setElapsedTime(0);
      setOperationNotes('');
      setShowNotesSection(false);
      notification.warning({ message: 'Operation stopped by user.' });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Table columns for barrels
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Caliber', dataIndex: 'caliber', key: 'caliber', width: 150 },
    { title: 'Length (in)', dataIndex: 'length_inches', key: 'length_inches', width: 100 },
    { title: 'Twist', dataIndex: 'twist_rate', key: 'twist_rate', width: 80 },
    { title: 'Material', dataIndex: 'material', key: 'material', width: 130 },
    { 
      title: 'Priority', 
      dataIndex: 'priority', 
      key: 'priority',
      width: 100,
      render: (p: string) => (
        <span className={`priority-${p.toLowerCase()}`}>
          {p}
        </span>
      )
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      width: 160,
      render: (s: string) => {
        const statusClass = s.includes('PENDING') ? 'status-pending' : 
                           s.includes('IN_PROGRESS') ? 'status-in-progress' : 'status-completed';
        return <span className={`status-badge ${statusClass}`}>{s.replace(/_/g, ' ')}</span>;
      }
    },
    {
      title: 'QC',
      dataIndex: 'qc_status',
      key: 'qc_status',
      width: 80,
      render: (qcStatus: string, record: SimpleBarrel) => {
        if (record.qc_status === 'hold') {
          return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>🛑 HOLD</span>;
        }
        if (record.qc_status === 'passed') {
          return <span style={{ color: '#52c41a' }}>✓ Pass</span>;
        }
        if (record.qc_status === 'failed') {
          return <span style={{ color: '#ff4d4f' }}>✗ Fail</span>;
        }
        return <span style={{ color: '#999' }}>—</span>;
      }
    },
    { 
      title: 'Created', 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 160,
      render: (d: string) => new Date(d).toLocaleString() 
    },
    {
      title: 'Begin Time',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 140,
      render: (d?: string) => d ? new Date(d).toLocaleString() : <span style={{ color: '#9ca3af' }}>N/A</span>
    },
    {
      title: 'End Time',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 140,
      render: (d?: string) => d ? new Date(d).toLocaleString() : <span style={{ color: '#9ca3af' }}>N/A</span>
    },
    {
      title: 'Operator',
      key: 'operator',
      width: 130,
      render: (_: any, record: SimpleBarrel) => {
        if (record.current_operator_name) {
          const isCurrentUser = mockApiService.isCurrentOperator(record);
          return (
            <span style={{ 
              color: isCurrentUser ? '#52c41a' : '#faad14',
              fontWeight: 600 
            }}>
              {isCurrentUser ? '👤 You' : `👥 ${record.current_operator_name}`}
            </span>
          );
        }
        return <span style={{ color: '#999' }}>Available</span>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SimpleBarrel) => {
        const isOwner = mockApiService.isCurrentOperator(record);
        const hasOwner = !!record.current_operator_id;
        
        if (record.status.includes('PENDING')) {
          const canStartOperation = canAccessStation(selectedStation);
          return (
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartOperation(record.id)}
              disabled={activeBarrel !== null || isLoading || !canStartOperation}
              size="small"
              title={!canStartOperation ? 'You are not authorized to operate this station' : 'Start operation'}
            >
              Start
              {!canStartOperation && <span style={{ marginLeft: 4 }}>🔒</span>}
            </Button>
          );
        } else if (record.status.includes('IN_PROGRESS')) {
          if (isOwner) {
            // Current operator can control their operation
            return (
              <div style={{ display: 'flex', gap: 8 }}>
                {record.id === activeBarrel && isOperationActive ? (
                  <Button 
                    icon={<PauseCircleOutlined />}
                    onClick={handlePauseOperation}
                    size="small"
                    disabled={!canAccessStation(selectedStation)}
                    title={!canAccessStation(selectedStation) ? 'You are not authorized to operate this station' : 'Pause operation'}
                  >
                    Pause
                    {!canAccessStation(selectedStation) && <span style={{ marginLeft: 4 }}>🔒</span>}
                  </Button>
                ) : (
                  <Button 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleResumeOperation(record.id)}
                    size="small"
                    disabled={!canAccessStation(selectedStation)}
                    title={!canAccessStation(selectedStation) ? 'You are not authorized to operate this station' : 'Resume operation'}
                  >
                    Resume
                    {!canAccessStation(selectedStation) && <span style={{ marginLeft: 4 }}>🔒</span>}
                  </Button>
                )}
                <Button 
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleCompleteOperation(record.id)}
                  size="small"
                  disabled={!canAccessStation(selectedStation)}
                  title={!canAccessStation(selectedStation) ? 'You are not authorized to operate this station' : 'Complete operation'}
                >
                  Complete
                  {!canAccessStation(selectedStation) && <span style={{ marginLeft: 4 }}>🔒</span>}
                </Button>
              </div>
            );
          } else if (hasOwner) {
            // Another operator owns this - show read-only status
            return (
              <span style={{ 
                color: '#faad14', 
                fontSize: '12px',
                fontWeight: 600 
              }}>
                🔒 In Use by {record.current_operator_name || mockApiService.getTabletDisplayName(record.current_tablet_id)}
              </span>
            );
          } else {
            // Somehow in progress but no owner - allow resume
            return (
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={() => handleResumeOperation(record.id)}
                size="small"
                disabled={activeBarrel !== null && activeBarrel !== record.id}
              >
                Resume
              </Button>
            );
          }
        } else {
          return <span style={{ color: '#999' }}>Waiting...</span>;
        }
      }
    }
  ];

  // If user has no station assignments, show access denied screen (except for admins and supervisors)
  if (!assignedStation && currentUser?.role === 'operator') {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          padding: 24
        }}>
          <Card style={{ 
            maxWidth: 500, 
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ 
                fontSize: 64, 
                color: '#ff4d4f',
                marginBottom: 16
              }}>
                🚫
              </div>
              <Title level={2} style={{ color: '#ff4d4f', marginBottom: 8 }}>
                Access Restricted
              </Title>
              <Title level={4} style={{ color: '#666', fontWeight: 400 }}>
                No Station Assignment
              </Title>
            </div>
            
            <div style={{ marginBottom: 24, color: '#666', lineHeight: 1.6 }}>
              <p>You are not currently assigned to any production station.</p>
              <p>Please contact your supervisor or administrator to:</p>
            </div>
            
            <div style={{ 
              background: '#f9f9f9', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24,
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: 8 }}>
                <strong>✓</strong> Request station assignment
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>✓</strong> Verify your user permissions
              </div>
              <div>
                <strong>✓</strong> Complete required training
              </div>
            </div>

            <div style={{ 
              fontSize: 13, 
              color: '#999',
              borderTop: '1px solid #eee',
              paddingTop: 16
            }}>
              <div style={{ marginBottom: 4 }}>
                <strong>User:</strong> {currentUser?.fullName || 'Unknown'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Role:</strong> {currentUser?.role || 'Unknown'}
              </div>
              <div>
                <strong>Tablet:</strong> {mockApiService.getTabletDisplayName(mockApiService.getTabletId())}
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // Security validation: Ensure user has access to currently selected station
  React.useEffect(() => {
    if (selectedStation && !canAccessStation(selectedStation)) {
      // Reset to first accessible station or show error
      const firstAccessible = accessibleStations[0];
      if (firstAccessible) {
        setSelectedStation(firstAccessible.id);
        notification.warning({
          message: 'Station Access Restricted',
          description: `Redirected to ${firstAccessible.name} - your assigned station.`
        });
      } else {
        notification.error({
          message: 'No Station Access',
          description: 'You are not assigned to any stations. Please contact your supervisor.'
        });
      }
    }
  }, [selectedStation, accessibleStations]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={240} 
        breakpoint="lg" 
        collapsedWidth="0" 
        style={{ 
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ 
          height: 72, 
          margin: 16, 
          textAlign: 'center', 
          fontWeight: 700, 
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1f2937'
        }}>
          <AppstoreOutlined style={{ fontSize: 28, color: '#1677ff', marginRight: 10 }} />
          MES Admin
        </div>
        <Menu 
          mode="inline" 
          selectedKeys={[selectedStation]} 
          onClick={e => {
            // Security check: Only allow selection of accessible stations
            if (canAccessStation(e.key)) {
              setSelectedStation(e.key);
            } else {
              notification.error({
                message: 'Access Denied',
                description: 'You are not authorized to access this station.'
              });
            }
          }}
          items={accessibleStations.map(station => ({
            key: station.id,
            icon: <BarChartOutlined style={{ fontSize: 18 }} />,
            label: (
              <span style={{ fontSize: 15 }}>
                {station.name}
                {!canAccessStation(station.id) && (
                  <span style={{ color: '#ff4d4f', fontSize: 11, marginLeft: 8 }}>🔒</span>
                )}
              </span>
            )
          }))}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)', 
          color: '#fff', 
          padding: '0 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: 56,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          {/* Left: Title and status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Rifle Barrel MES</span>
            <span style={{ 
              fontSize: 11, 
              background: syncConfig.enabled ? '#52c41a' : '#faad14',
              padding: '2px 8px',
              borderRadius: 4
            }}>
              {syncConfig.enabled ? 'Sync' : 'Local'}
            </span>
          </div>
          
          {/* Center: User info */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            background: 'rgba(255,255,255,0.15)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13
          }}>
            <span>👤 {currentUser?.fullName || 'Anonymous'}</span>
            <span style={{ 
              background: currentUser?.role === 'admin' ? '#722ed1' : currentUser?.role === 'supervisor' ? '#faad14' : '#52c41a',
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600
            }}>
              {currentUser?.role?.toUpperCase()}
            </span>
            {mockApiService.isImpersonating() && (
              <Button
                size="small"
                onClick={async () => {
                  const originalUser = await mockApiService.stopImpersonation();
                  if (originalUser) window.location.reload();
                }}
                style={{ background: '#fa8c16', border: 'none', color: '#fff', height: 20, fontSize: 10, padding: '0 6px' }}
              >
                🎭 Stop
              </Button>
            )}
          </div>
          
          {/* Right: Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button 
              icon={<BarChartOutlined />} 
              onClick={() => setShowBarrelTracking(true)} 
              size="small"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}
            >
              Tracking
            </Button>
            
            <Button 
              icon={<SafetyCertificateOutlined />} 
              onClick={() => setShowQCDashboard(true)} 
              size="small"
              style={{ 
                background: 'transparent', 
                border: `1px solid ${qcStats?.barrelsOnHold > 0 ? '#ff4d4f' : 'rgba(255,255,255,0.5)'}`, 
                color: qcStats?.barrelsOnHold > 0 ? '#ff4d4f' : '#fff' 
              }}
            >
              QC {qcStats?.barrelsOnHold > 0 && `(${qcStats.barrelsOnHold})`}
            </Button>
            
            {currentUser?.role === 'admin' && (
              <Button 
                icon={<AppstoreOutlined />} 
                onClick={() => onShowAdminPanel?.()} 
                size="small"
                style={{ background: '#722ed1', border: 'none', color: '#fff' }}
              >
                Admin
              </Button>
            )}
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadData} 
              loading={isLoading} 
              size="small"
              style={{ background: '#52c41a', border: 'none', color: '#fff' }}
            />
            
            <Button 
              onClick={handleLogout} 
              size="small"
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff' }}
            >
              Logout
            </Button>
          </div>
        </Header>
        
        <Content style={{ margin: 24 }}>
          {/* Security Warning Banner for Users Without Station Access */}
          {currentUser && currentUser.role === 'operator' && accessibleStations.length === 0 && (
            <div style={{
              background: 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #f87171',
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                🚫 Station Access Required
              </div>
              <div style={{ color: '#7f1d1d', fontSize: 14 }}>
                You are not currently assigned to any manufacturing stations. Contact your supervisor to request station access.
                All manufacturing operations are restricted until station assignment is completed.
              </div>
            </div>
          )}
          
          {/* Station Access Status for Operators */}
          {currentUser && currentUser.role === 'operator' && accessibleStations.length > 0 && !canAccessStation(selectedStation) && (
            <div style={{
              background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#d97706', marginBottom: 8 }}>
                ⚠️ Unauthorized Station Selected
              </div>
              <div style={{ color: '#92400e', fontSize: 15 }}>
                You are viewing a station you're not authorized to operate. 
                Your assigned stations: {accessibleStations.map(s => s.name).join(', ')}
              </div>
            </div>
          )}
          
          <Row gutter={24} style={{ marginBottom: 28 }}>
            <Col span={6}>
              <Card className="metrics-card" style={{ borderLeft: '4px solid #1677ff' }}>
                <Statistic 
                  title="Total WIP" 
                  value={metrics?.total_wip || 0} 
                  prefix={<BarChartOutlined style={{ color: '#1677ff', fontSize: 24 }} />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="metrics-card" style={{ borderLeft: '4px solid #52c41a' }}>
                <Statistic 
                  title="Completed Today" 
                  value={metrics?.completed_today || 0} 
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="metrics-card" style={{ borderLeft: '4px solid #faad14' }}>
                <Statistic 
                  title="In Progress" 
                  value={barrels.filter(b => b.status.includes('IN_PROGRESS')).length} 
                  prefix={<ClockCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block 
                size="large"
                style={{ height: '100%', minHeight: 90, fontSize: 18, fontWeight: 600 }}
                onClick={() => setShowNewBarrelForm(true)}
              >
                + New Barrel
              </Button>
            </Col>
          </Row>
          
          <Card 
            title={
              <span style={{ fontSize: 20, fontWeight: 600 }}>
                {stations.find(s => s.id === selectedStation)?.name} Station
              </span>
            } 
            variant="outlined"
            style={{ marginBottom: 24 }}
          >
            <Table
              dataSource={getBarrelsForStation()}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              scroll={{ x: 1200 }}
              locale={{ emptyText: 'No barrels at this station.' }}
            />
          </Card>

          {/* Active Operation Timer - Only for Current User's Operations */}
          {activeBarrel && (() => {
            const currentBarrel = barrels.find(b => b.id === activeBarrel);
            const isCurrentUserOperation = currentBarrel && mockApiService.isCurrentOperator(currentBarrel);
            
            // Only show controls if this user owns the operation
            if (!isCurrentUserOperation) {
              return null;
            }
            
            return (
              <Card 
                title={`Active Operation - ${stations.find(s => s.id === selectedStation)?.name || 'Unknown Station'} - Barrel #${activeBarrel}`}
                style={{ 
                  marginBottom: 24,
                  border: '2px solid #1677ff',
                  backgroundColor: '#f6ffed'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '48px', 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold',
                    color: '#1677ff',
                    marginBottom: 16
                  }}>
                    {formatTime(elapsedTime)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                    {isOperationActive ? (
                      <Button 
                        icon={<PauseCircleOutlined />}
                        onClick={handlePauseOperation}
                        size="large"
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button 
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleResumeOperation()}
                        size="large"
                      >
                        Resume
                      </Button>
                    )}
                    <Button 
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleCompleteOperation(activeBarrel)}
                      size="large"
                    >
                      Complete
                    </Button>
                    <Button 
                      danger
                      icon={<ExclamationCircleOutlined />}
                      onClick={handleStopOperation}
                      size="large"
                    >
                      Stop
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()}
          
          {/* New Barrel Modal */}
          <Modal
            title="Create New Barrel"
            open={showNewBarrelForm}
            onCancel={() => setShowNewBarrelForm(false)}
            footer={null}
          >
            <Form 
              layout="vertical" 
              onFinish={async (values) => {
                setIsLoading(true);
                try {
                  await mockApiService.createBarrel(values);
                  notification.success({ message: 'Barrel created!' });
                  setShowNewBarrelForm(false);
                  setNewBarrel({
                    caliber: '.308 Winchester',
                    length_inches: 24,
                    twist_rate: '1:10',
                    material: '416R Stainless',
                    priority: 'Medium'
                  });
                  await loadData();
                } catch {
                  notification.error({ message: 'Failed to create barrel.' });
                } finally {
                  setIsLoading(false);
                }
              }} 
              initialValues={newBarrel}
            >
              <Form.Item label="Caliber" name="caliber" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value=".308 Winchester">.308 Winchester</Select.Option>
                  <Select.Option value="6.5 Creedmoor">6.5 Creedmoor</Select.Option>
                  <Select.Option value=".223 Wylde">.223 Wylde</Select.Option>
                  <Select.Option value="6mm Creedmoor">6mm Creedmoor</Select.Option>
                  <Select.Option value=".300 Win Mag">.300 Win Mag</Select.Option>
                  <Select.Option value="6.5 PRC">6.5 PRC</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Length (inches)" name="length_inches" rules={[{ required: true }]}>
                <Input type="number" min={16} max={32} />
              </Form.Item>
              
              <Form.Item label="Twist Rate" name="twist_rate" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="1:7">1:7</Select.Option>
                  <Select.Option value="1:8">1:8</Select.Option>
                  <Select.Option value="1:9">1:9</Select.Option>
                  <Select.Option value="1:10">1:10</Select.Option>
                  <Select.Option value="1:11">1:11</Select.Option>
                  <Select.Option value="1:12">1:12</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Material" name="material" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="416R Stainless">416R Stainless</Select.Option>
                  <Select.Option value="4140 Chrome Moly">4140 Chrome Moly</Select.Option>
                  <Select.Option value="4150 Chrome Moly">4150 Chrome Moly</Select.Option>
                  <Select.Option value="17-4 Stainless">17-4 Stainless</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Low">Low</Select.Option>
                  <Select.Option value="Medium">Medium</Select.Option>
                  <Select.Option value="High">High</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button htmlType="submit" type="primary" loading={isLoading} block>
                  Create Barrel
                </Button>
              </Form.Item>
            </Form>
          </Modal>
          
          {/* Barrel Tracking Modal for non-admin users */}
          <Modal
            title="📊 Barrel Process Tracking"
            open={showBarrelTracking}
            onCancel={() => setShowBarrelTracking(false)}
            width={1200}
            footer={[
              <Button key="refresh" icon={<ReloadOutlined />} onClick={loadData}>
                Refresh
              </Button>,
              <Button key="close" type="primary" onClick={() => setShowBarrelTracking(false)}>
                Close
              </Button>
            ]}
          >
            <Table
              dataSource={barrelTrackingData}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id', width: 60, fixed: 'left' },
                { title: 'Caliber', dataIndex: 'caliber', key: 'caliber', width: 120 },
                { 
                  title: 'Priority', 
                  dataIndex: 'priority', 
                  key: 'priority',
                  render: (p: string) => (
                    <span style={{ 
                      fontWeight: 600,
                      color: p === 'High' ? '#f5222d' : p === 'Medium' ? '#faad14' : '#52c41a'
                    }}>
                      {p}
                    </span>
                  )
                },
                { 
                  title: 'Current Station', 
                  dataIndex: 'currentStation',
                  key: 'currentStation',
                  width: 150,
                  render: (station: string, record: any) => (
                    <div>
                      <span style={{ fontWeight: 600 }}>{station}</span>
                      {record.isActive && (
                        <span style={{ 
                          marginLeft: 8,
                          color: '#1677ff',
                          fontSize: 11,
                          background: '#e6f7ff',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                  )
                },
                { 
                  title: 'Progress', 
                  key: 'progress',
                  render: (_, record) => {
                    const statusParts = record.status.split('_');
                    const stationStatus = statusParts.slice(0, -1).join('_');
                    const currentStation = stations.find(s => 
                      s.name.toUpperCase().replace(' ', '_') === stationStatus
                    );
                    
                    const currentStationIndex = currentStation ? currentStation.sequence : 
                      (record.status === 'COMPLETED' ? stations.length + 1 : 0);
                    const progressPercentage = Math.round((currentStationIndex / (stations.length + 1)) * 100);
                    
                    return (
                      <div style={{ width: 100 }}>
                        <div style={{ 
                          background: '#f0f0f0', 
                          borderRadius: 4, 
                          overflow: 'hidden',
                          height: 8
                        }}>
                          <div style={{ 
                            background: record.status === 'COMPLETED' ? '#52c41a' : '#1677ff', 
                            width: `${progressPercentage}%`,
                            height: '100%',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <div style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                          {progressPercentage}%
                        </div>
                      </div>
                    );
                  }
                },
                { 
                  title: 'Operator', 
                  dataIndex: 'current_operator_name',
                  key: 'operator',
                  width: 150,
                  render: (name: string) => name ? (
                    <span style={{ color: '#1677ff' }}>👤 {name}</span>
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )
                },
                {
                  title: 'View',
                  key: 'actions',
                  render: (_: any, record: any) => (
                    <Button 
                      size="small"
                      onClick={() => setSelectedBarrelDetails(record)}
                    >
                      Details
                    </Button>
                  )
                }
              ]}
            />
          </Modal>

          {/* Barrel Details Modal */}
          <Modal
            title={selectedBarrelDetails ? `Barrel #${selectedBarrelDetails.id} Details` : 'Barrel Details'}
            open={!!selectedBarrelDetails}
            onCancel={() => setSelectedBarrelDetails(null)}
            width={650}
            footer={[
              <Button key="close" type="primary" onClick={() => setSelectedBarrelDetails(null)}>
                Close
              </Button>
            ]}
          >
            {selectedBarrelDetails && (
              <div>
                <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>📋 Specifications</div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>Caliber</div>
                      <div style={{ fontWeight: 600 }}>{selectedBarrelDetails.caliber}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>Length</div>
                      <div style={{ fontWeight: 600 }}>{selectedBarrelDetails.length_inches}"</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#666', fontSize: 12 }}>Twist Rate</div>
                      <div style={{ fontWeight: 600 }}>{selectedBarrelDetails.twist_rate}</div>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: '#666', fontSize: 12 }}>Material</div>
                    <div style={{ fontWeight: 600 }}>{selectedBarrelDetails.material}</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: '#666', fontSize: 12 }}>Current Status</div>
                    <div style={{ fontWeight: 600 }}>{selectedBarrelDetails.currentStation} - {selectedBarrelDetails.progressPercentage}% Complete</div>
                  </div>
                  {selectedBarrelDetails.qc_status && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: '#666', fontSize: 12 }}>QC Status</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedBarrelDetails.qc_status === 'hold' && (
                          <span style={{ color: '#ff4d4f' }}>🛑 ON HOLD - {selectedBarrelDetails.hold_reason}</span>
                        )}
                        {selectedBarrelDetails.qc_status === 'passed' && (
                          <span style={{ color: '#52c41a' }}>✓ PASSED</span>
                        )}
                        {selectedBarrelDetails.qc_status === 'failed' && (
                          <span style={{ color: '#ff4d4f' }}>✗ FAILED</span>
                        )}
                        {selectedBarrelDetails.qc_status === 'pending' && (
                          <span style={{ color: '#faad14' }}>⏳ PENDING</span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Inspection History */}
                {selectedBarrelDetails.inspections && selectedBarrelDetails.inspections.length > 0 && (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🔍 Inspection History</div>
                    {selectedBarrelDetails.inspections.map((insp: InspectionRecord, index: number) => (
                      <Card 
                        key={index} 
                        size="small" 
                        style={{ 
                          marginBottom: 8, 
                          borderLeft: `4px solid ${insp.overall_result === 'pass' ? '#52c41a' : insp.overall_result === 'fail' ? '#ff4d4f' : '#faad14'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600 }}>{insp.inspection_type.replace('_', ' ').toUpperCase()}</div>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 11,
                            background: insp.overall_result === 'pass' ? '#f6ffed' : insp.overall_result === 'fail' ? '#fff2f0' : '#fffbe6',
                            color: insp.overall_result === 'pass' ? '#52c41a' : insp.overall_result === 'fail' ? '#ff4d4f' : '#faad14'
                          }}>
                            {insp.overall_result.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                          Inspector: {insp.inspector_name} | {new Date(insp.created_at).toLocaleString()}
                        </div>
                        {insp.measurements && insp.measurements.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 12 }}>
                            {insp.measurements.map((m, mi) => (
                              <span key={mi} style={{ 
                                marginRight: 12,
                                color: m.passed ? '#52c41a' : '#ff4d4f'
                              }}>
                                {m.name}: {m.value}{m.unit} {m.passed ? '✓' : '✗'}
                              </span>
                            ))}
                          </div>
                        )}
                        {insp.notes && <div style={{ marginTop: 4, fontStyle: 'italic', fontSize: 12 }}>📝 {insp.notes}</div>}
                      </Card>
                    ))}
                  </>
                )}
                
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🔧 Operation History</div>
                {selectedBarrelDetails.operationHistory && selectedBarrelDetails.operationHistory.length > 0 ? (
                  selectedBarrelDetails.operationHistory.map((log: any, index: number) => (
                    <Card key={index} size="small" style={{ marginBottom: 8, borderLeft: '4px solid #1677ff' }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{log.station_name}</div>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                        <div>👤 Operator: {log.operator_name || 'Unknown'}</div>
                        <div>🕐 Started: {new Date(log.start_time).toLocaleString()}</div>
                        {log.end_time && <div>✓ Completed: {new Date(log.end_time).toLocaleString()}</div>}
                        {log.notes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>📝 Notes: {log.notes}</div>}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card size="small" style={{ textAlign: 'center', color: '#999' }}>
                    <p>No operation history available yet.</p>
                    <p style={{ fontSize: 12 }}>History will appear after operations are completed.</p>
                  </Card>
                )}
              </div>
            )}
          </Modal>

          {/* QC Dashboard Modal */}
          <Modal
            title={
              <span style={{ fontSize: 20 }}>
                <SafetyCertificateOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                Quality Control Dashboard
              </span>
            }
            open={showQCDashboard}
            onCancel={() => setShowQCDashboard(false)}
            width={1000}
            footer={[
              <Button key="refresh" icon={<ReloadOutlined />} onClick={loadData}>
                Refresh
              </Button>,
              <Button key="close" type="primary" onClick={() => setShowQCDashboard(false)}>
                Close
              </Button>
            ]}
          >
            {/* QC Stats Summary */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small" style={{ borderLeft: '4px solid #52c41a', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}>{qcStats?.passRate || 0}%</div>
                  <div style={{ color: '#666' }}>Pass Rate</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderLeft: '4px solid #1677ff', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>{qcStats?.totalInspections || 0}</div>
                  <div style={{ color: '#666' }}>Total Inspections</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderLeft: '4px solid #ff4d4f', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}>{qcStats?.barrelsOnHold || 0}</div>
                  <div style={{ color: '#666' }}>On Hold</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ borderLeft: '4px solid #faad14', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}>{qcStats?.barrelsAwaitingInspection || 0}</div>
                  <div style={{ color: '#666' }}>Awaiting Inspection</div>
                </Card>
              </Col>
            </Row>

            {/* Barrels on Hold Section */}
            {barrels.filter(b => b.qc_status === 'hold').length > 0 && (
              <Card 
                title={<span style={{ color: '#ff4d4f' }}><StopOutlined /> Barrels on Hold (Quarantine)</span>}
                size="small"
                style={{ marginBottom: 16, borderColor: '#ff4d4f' }}
              >
                <Table
                  dataSource={barrels.filter(b => b.qc_status === 'hold')}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Barrel ID', dataIndex: 'id', key: 'id', render: (id: string) => `#${id}` },
                    { title: 'Caliber', dataIndex: 'caliber', key: 'caliber' },
                    { title: 'Reason', dataIndex: 'hold_reason', key: 'reason', render: (r: string) => <span style={{ color: '#ff4d4f' }}>{r}</span> },
                    { title: 'Held By', dataIndex: 'held_by', key: 'held_by' },
                    { title: 'Hold Date', dataIndex: 'hold_date', key: 'date', render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
                    { 
                      title: 'Actions', 
                      key: 'actions',
                      render: (_: any, record: SimpleBarrel) => (
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={async () => {
                            const notes = prompt('Release notes (optional):');
                            await mockApiService.releaseBarrelFromHold(record.id, notes || undefined);
                            loadData();
                          }}
                        >
                          Release
                        </Button>
                      )
                    }
                  ]}
                />
              </Card>
            )}

            {/* All Barrels QC Status */}
            <Card 
              title={<span><CheckSquareOutlined /> Barrel QC Status</span>}
              size="small"
              extra={
                <Button 
                  type="primary" 
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    // Open inspection form for first barrel
                    if (barrels.length > 0) {
                      setInspectionBarrel(barrels[0]);
                      setShowInspectionForm(true);
                    }
                  }}
                >
                  New Inspection
                </Button>
              }
            >
              <Table
                dataSource={barrels}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: 'ID', dataIndex: 'id', key: 'id', width: 60, render: (id: string) => `#${id}` },
                  { title: 'Caliber', dataIndex: 'caliber', key: 'caliber', width: 120 },
                  { title: 'Status', dataIndex: 'status', key: 'status', width: 150,
                    render: (status: string) => {
                      const stationName = status.replace(/_IN_PROGRESS$|_PENDING$/, '').replace(/_/g, ' ');
                      return stationName;
                    }
                  },
                  { 
                    title: 'QC Status', 
                    dataIndex: 'qc_status', 
                    key: 'qc_status',
                    width: 100,
                    render: (qcStatus: string) => {
                      const colors: Record<string, { bg: string, color: string, label: string }> = {
                        'passed': { bg: '#f6ffed', color: '#52c41a', label: 'PASSED' },
                        'failed': { bg: '#fff2f0', color: '#ff4d4f', label: 'FAILED' },
                        'hold': { bg: '#fff2f0', color: '#ff4d4f', label: 'ON HOLD' },
                        'pending': { bg: '#fffbe6', color: '#faad14', label: 'PENDING' }
                      };
                      const style = colors[qcStatus] || colors['pending'];
                      return (
                        <span style={{ 
                          background: style.bg, 
                          color: style.color, 
                          padding: '2px 8px', 
                          borderRadius: 4,
                          fontWeight: 600,
                          fontSize: 11
                        }}>
                          {style.label}
                        </span>
                      );
                    }
                  },
                  { 
                    title: 'Inspections', 
                    key: 'inspections',
                    width: 100,
                    render: (_: any, record: SimpleBarrel) => record.inspections?.length || 0
                  },
                  { 
                    title: 'Actions', 
                    key: 'actions',
                    render: (_: any, record: SimpleBarrel) => (
                      <Space>
                        <Button 
                          size="small"
                          type="primary"
                          onClick={() => {
                            setInspectionBarrel(record);
                            setShowInspectionForm(true);
                          }}
                        >
                          Inspect
                        </Button>
                        {record.qc_status !== 'hold' && (
                          <Button 
                            size="small"
                            danger
                            icon={<StopOutlined />}
                            onClick={() => {
                              setHoldBarrel(record);
                              setHoldModalVisible(true);
                            }}
                          >
                            Hold
                          </Button>
                        )}
                      </Space>
                    )
                  }
                ]}
              />
            </Card>
          </Modal>

          {/* Hold Barrel Modal */}
          <Modal
            title={<span style={{ color: '#ff4d4f' }}><WarningOutlined /> Place Barrel on Hold</span>}
            open={holdModalVisible}
            onCancel={() => {
              setHoldModalVisible(false);
              setHoldBarrel(null);
              setHoldReason('');
            }}
            onOk={async () => {
              if (holdBarrel && holdReason) {
                await mockApiService.placeBarrelOnHold(holdBarrel.id, holdReason);
                setHoldModalVisible(false);
                setHoldBarrel(null);
                setHoldReason('');
                loadData();
              }
            }}
            okText="Place on Hold"
            okButtonProps={{ danger: true, disabled: !holdReason }}
          >
            <p>This will place Barrel #{holdBarrel?.id} on hold and prevent further processing.</p>
            <Form.Item label="Hold Reason" required>
              <Input.TextArea
                rows={3}
                placeholder="Enter reason for placing barrel on hold..."
                value={holdReason}
                onChange={e => setHoldReason(e.target.value)}
              />
            </Form.Item>
          </Modal>

          {/* Inspection Form Modal */}
          <Modal
            title={<span><SafetyCertificateOutlined /> Record Inspection - Barrel #{inspectionBarrel?.id}</span>}
            open={showInspectionForm}
            onCancel={() => {
              setShowInspectionForm(false);
              setInspectionBarrel(null);
            }}
            width={700}
            footer={null}
          >
            {inspectionBarrel && (
              <Form
                layout="vertical"
                onFinish={async (values) => {
                  // Build inspection record
                  const measurements: InspectionMeasurement[] = [];
                  
                  // Add bore diameter measurement
                  if (values.bore_diameter) {
                    const boreSpec = { min: 0.300, max: 0.310 }; // Example spec for .308
                    measurements.push({
                      name: 'Bore Diameter',
                      value: parseFloat(values.bore_diameter),
                      unit: 'inches',
                      min_spec: boreSpec.min,
                      max_spec: boreSpec.max,
                      passed: parseFloat(values.bore_diameter) >= boreSpec.min && parseFloat(values.bore_diameter) <= boreSpec.max
                    });
                  }
                  
                  // Add groove diameter measurement
                  if (values.groove_diameter) {
                    const grooveSpec = { min: 0.308, max: 0.310 };
                    measurements.push({
                      name: 'Groove Diameter',
                      value: parseFloat(values.groove_diameter),
                      unit: 'inches',
                      min_spec: grooveSpec.min,
                      max_spec: grooveSpec.max,
                      passed: parseFloat(values.groove_diameter) >= grooveSpec.min && parseFloat(values.groove_diameter) <= grooveSpec.max
                    });
                  }
                  
                  // Build defects array
                  const defects: Defect[] = [];
                  if (values.defect_type && values.defect_description) {
                    defects.push({
                      id: `def_${Date.now()}`,
                      type: values.defect_type,
                      severity: values.defect_severity || 'minor',
                      description: values.defect_description,
                      location: values.defect_location,
                      detected_by: currentUser?.fullName || 'Unknown',
                      detected_at: new Date().toISOString()
                    });
                  }
                  
                  // Determine overall result
                  const allMeasurementsPassed = measurements.every(m => m.passed);
                  const hasCriticalDefect = defects.some(d => d.severity === 'critical');
                  const hasMajorDefect = defects.some(d => d.severity === 'major');
                  
                  let overallResult: 'pass' | 'fail' | 'conditional' = 'pass';
                  if (hasCriticalDefect || !allMeasurementsPassed) {
                    overallResult = 'fail';
                  } else if (hasMajorDefect) {
                    overallResult = 'conditional';
                  }
                  
                  // Override with manual selection if specified
                  if (values.overall_result) {
                    overallResult = values.overall_result;
                  }
                  
                  await mockApiService.addInspection(inspectionBarrel.id, {
                    station_id: '9', // Inspection station
                    station_name: 'Inspection',
                    inspector_id: currentUser?.id || 'unknown',
                    inspector_name: currentUser?.fullName || 'Unknown',
                    inspection_type: values.inspection_type || 'in_process',
                    measurements,
                    defects,
                    overall_result: overallResult,
                    notes: values.notes
                  });
                  
                  notification.success({ 
                    message: 'Inspection Recorded', 
                    description: `Barrel #${inspectionBarrel.id} - ${overallResult.toUpperCase()}`
                  });
                  
                  setShowInspectionForm(false);
                  setInspectionBarrel(null);
                  loadData();
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Inspection Type" name="inspection_type" initialValue="in_process">
                      <Select>
                        <Select.Option value="incoming">Incoming Material</Select.Option>
                        <Select.Option value="in_process">In-Process</Select.Option>
                        <Select.Option value="final">Final Inspection</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Overall Result" name="overall_result">
                      <Select placeholder="Auto-calculated or select manually">
                        <Select.Option value="pass">✓ PASS</Select.Option>
                        <Select.Option value="conditional">⚠ CONDITIONAL</Select.Option>
                        <Select.Option value="fail">✗ FAIL</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Dimensional Measurements</div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Bore Diameter (inches)" name="bore_diameter">
                      <Input type="number" step="0.001" placeholder="e.g., 0.308" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Groove Diameter (inches)" name="groove_diameter">
                      <Input type="number" step="0.001" placeholder="e.g., 0.308" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Defect Recording (optional)</div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Defect Type" name="defect_type">
                      <Select placeholder="Select type" allowClear>
                        <Select.Option value="surface">Surface</Select.Option>
                        <Select.Option value="dimensional">Dimensional</Select.Option>
                        <Select.Option value="material">Material</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Severity" name="defect_severity">
                      <Select placeholder="Select severity" allowClear>
                        <Select.Option value="minor">Minor</Select.Option>
                        <Select.Option value="major">Major</Select.Option>
                        <Select.Option value="critical">Critical</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Location" name="defect_location">
                      <Input placeholder="e.g., Bore, 6 inches from muzzle" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Defect Description" name="defect_description">
                  <Input.TextArea rows={2} placeholder="Describe the defect..." />
                </Form.Item>
                
                <Form.Item label="Inspection Notes" name="notes">
                  <Input.TextArea rows={2} placeholder="Additional notes..." />
                </Form.Item>
                
                <Form.Item>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setShowInspectionForm(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit">Save Inspection</Button>
                  </div>
                </Form.Item>
              </Form>
            )}
          </Modal>

          {isLoading && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <Spin size="large" />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const isAuthenticated = mockApiService.isLoggedIn();
  
  // Initialize cross-browser sync on app start
  useEffect(() => {
    mockApiService.initSync();
    
    // Log sync status for debugging
    console.log('🔄 Multi-Browser Sync Initialized');
    console.log('📡 BroadcastChannel supported:', !!mockApiService.syncChannel);
    console.log('🆔 Tablet ID:', mockApiService.getTabletId());
    
    // Test sync by logging when messages are received
    if (mockApiService.syncChannel) {
      const testListener = (event: MessageEvent) => {
        console.log('📨 Sync message received:', event.data);
      };
      mockApiService.syncChannel.addEventListener('message', testListener);
      
      return () => {
        if (mockApiService.syncChannel) {
          mockApiService.syncChannel.removeEventListener('message', testListener);
        }
      };
    }
  }, []);
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  if (showAdminPanel) {
    return (
      <div>
        <div style={{ 
          position: 'fixed', 
          top: 16, 
          right: 16, 
          zIndex: 1000 
        }}>
          <Button 
            icon={<BarChartOutlined />} 
            onClick={() => setShowAdminPanel(false)}
            type="primary"
          >
            Back to MES
          </Button>
        </div>
        <AdminPanel />
      </div>
    );
  }
  
  return <AppContent onShowAdminPanel={() => setShowAdminPanel(true)} />;
}

export default App;
