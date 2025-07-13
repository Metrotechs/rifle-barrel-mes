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
  Layout, Menu, Card, Button, Modal, Table, Statistic, Row, Col, Input, Select, Form, notification, Spin, Typography
} from 'antd';

const { Title } = Typography;
import {
  PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, PlusOutlined, ReloadOutlined, ExclamationCircleOutlined, ClockCircleOutlined, BarChartOutlined, AppstoreOutlined
} from '@ant-design/icons';
import 'antd/dist/reset.css';

// --- TYPE DEFINITIONS ---
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
      { id: 'user001', username: 'jsmith', fullName: 'John Smith', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user002', username: 'mjohnson', fullName: 'Mary Johnson', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user003', username: 'rbrown', fullName: 'Robert Brown', role: 'supervisor' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() },
      { id: 'user004', username: 'swilson', fullName: 'Sarah Wilson', role: 'operator' as const, department: 'Quality Control', isActive: true, created_at: new Date().toISOString() },
      { id: 'user005', username: 'admin', fullName: 'System Administrator', role: 'admin' as const, department: 'IT', isActive: true, created_at: new Date().toISOString() },
      { id: 'user006', username: 'testuser', fullName: 'Unassigned User', role: 'operator' as const, department: 'Manufacturing', isActive: true, created_at: new Date().toISOString() }
    ];
    
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : defaultUsers;
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
    const stored = localStorage.getItem('station_assignments');
    return stored ? JSON.parse(stored) : [];
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
    
    const totalOperations = barrels.reduce((sum, barrel) => sum + barrel.operation_logs.length, 0);
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
        .flatMap(b => b.operation_logs)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 10)
    };
  },

  // Authentication methods
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

  logout: async (): Promise<void> => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('current_user');
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
    mockApiService.syncListeners.forEach(callback => callback());
  },
  
  // Enhanced data persistence with cross-browser sync
  saveData: async (key: string, data: any) => {
    // Save to localStorage (immediate local storage)
    localStorage.setItem(key, JSON.stringify(data));
    
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

  getStations: (): SimpleStation[] => [
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
    
    return await mockApiService.loadData('barrels', demoBarrels);
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
    const barrels = await mockApiService.getBarrels();
    const barrel = barrels.find(b => b.id === barrelId);
    if (barrel) {
      // Check if barrel is already owned by another operator
      if (barrel.current_operator_id && barrel.current_operator_id !== mockApiService.getOperatorId()) {
        throw new Error(`Barrel is currently being worked on by ${barrel.current_operator_name || 'another operator'} (${barrel.current_tablet_id})`);
      }
      
      const stationStatus = stationName.toUpperCase().replace(' ', '_');
      barrel.status = `${stationStatus}_IN_PROGRESS`;
      barrel.started_at = new Date().toISOString();
      barrel.current_operator_id = mockApiService.getOperatorId();
      barrel.current_operator_name = mockApiService.getOperatorName();
      barrel.current_tablet_id = mockApiService.getTabletId();
      
      barrel.operation_logs.push({
        station_name: stationName,
        start_time: new Date().toISOString(),
        end_time: null,
        operator_id: mockApiService.getOperatorId(),
        operator_name: mockApiService.getOperatorName(),
        tablet_id: mockApiService.getTabletId()
      });
      await mockApiService.saveData('barrels', barrels); // Sync across tablets
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
      // Security check: Only the operator who started this operation can complete it
      if (barrel.current_operator_id && barrel.current_operator_id !== mockApiService.getOperatorId()) {
        throw new Error(`Only ${barrel.current_operator_name || 'the operator who started this operation'} can complete it (${barrel.current_tablet_id})`);
      }
      
      const stations = mockApiService.getStations();
      // Extract station name by removing _IN_PROGRESS or _PENDING suffix
      const currentStationName = barrel.status.replace(/_IN_PROGRESS$|_PENDING$/, '');
      const currentStation = stations.find(s => s.name.toUpperCase().replace(' ', '_') === currentStationName);
      const nextStation = stations.find(s => s.sequence === (currentStation?.sequence || 0) + 1);
      
      // Update the last operation log
      if (barrel.operation_logs.length > 0) {
        const lastLog = barrel.operation_logs[barrel.operation_logs.length - 1];
        lastLog.end_time = new Date().toISOString();
        if (notes) {
          lastLog.notes = notes;
        }
      }
      
      barrel.status = nextStation ? `${nextStation.name.toUpperCase().replace(' ', '_')}_PENDING` : 'COMPLETED';
      barrel.completed_at = barrel.status === 'COMPLETED' ? new Date().toISOString() : undefined;
      barrel.started_at = undefined;
      
      // Release ownership when operation is completed
      barrel.current_operator_id = undefined;
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
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 16 }}>
              {users.map(user => (
                <li key={user.id} style={{ margin: '4px 0' }}>
                  <strong>{user.username}</strong> - {user.fullName} ({user.role})
                </li>
              ))}
            </ul>
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
  const [assignments, setAssignments] = useState<StationAssignment[]>([]);
  const [barrels, setBarrels] = useState<SimpleBarrel[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserForm] = Form.useForm();

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, assignmentsData, analyticsData, barrelsData] = await Promise.all([
        Promise.resolve(mockApiService.getUsers()),
        Promise.resolve(mockApiService.getStationAssignments()),
        mockApiService.getSystemAnalytics(),
        mockApiService.getBarrels()
      ]);
      setUsers(usersData);
      setAssignments(assignmentsData);
      setAnalytics(analyticsData);
      setBarrels(barrelsData);
    } catch (error) {
      notification.error({ message: 'Error loading admin data' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Add real-time sync for admin panel
  useEffect(() => {
    const unsubscribe = mockApiService.onDataChange(() => {
      loadAdminData();
    });
    return unsubscribe;
  }, [loadAdminData]);

  // Add frequent polling for admin panel
  useEffect(() => {
    const interval = setInterval(() => { loadAdminData(); }, 5000);
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

  const handleStationAssignment = async (userId: string, stationId: string, assigned: boolean) => {
    try {
      if (assigned) {
        await mockApiService.assignUserToStation(userId, stationId);
        notification.success({ message: 'Station assigned successfully!' });
      } else {
        await mockApiService.removeStationAssignment(userId, stationId);
        notification.success({ message: 'Station assignment removed!' });
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
                  onClick={() => handleStationAssignment(record.id, station.id, !isAssigned)}
                  style={{ marginBottom: 4 }}
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
      render: (_: any, record: User) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            onClick={() => setEditingUser(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDeleteUser(record.id)}
            disabled={record.username === 'admin'}
          >
            Delete
          </Button>
        </div>
      )
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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
      
      <Content style={{ margin: 24 }}>
        {/* Analytics Overview */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Total Users" 
                value={analytics?.totalUsers || 0} 
                prefix={<PlayCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Active Users" 
                value={analytics?.activeUsers || 0} 
                prefix={<CheckCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic 
                title="Active Operators" 
                value={analytics?.activeOperators || 0} 
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
            <Button.Group>
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
            </Button.Group>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <Table
              dataSource={users}
              columns={userColumns}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          )}

          {/* Stations Tab */}
          {activeTab === 'stations' && (
            <Table
              dataSource={stations}
              columns={stationColumns}
              rowKey="id"
              loading={isLoading}
              pagination={false}
            />
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
              {barrels.filter(b => b.status.includes('IN_PROGRESS')).length > 0 ? (
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  {barrels
                    .filter(b => b.status.includes('IN_PROGRESS'))
                    .map(barrel => {
                      const stationName = barrel.status.replace('_IN_PROGRESS', '').replace(/_/g, ' ');
                      const isCurrentUser = mockApiService.isCurrentOperator(barrel);
                      
                      return (
                        <Col span={8} key={barrel.id}>
                          <Card 
                            size="small"
                            style={{ 
                              border: isCurrentUser ? '2px solid #52c41a' : '2px solid #722ed1',
                              backgroundColor: isCurrentUser ? '#f6ffed' : '#f9f0ff'
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: 18, 
                                fontWeight: 'bold',
                                color: isCurrentUser ? '#52c41a' : '#722ed1',
                                marginBottom: 12
                              }}>
                                🔧 {stationName}
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
                                background: isCurrentUser ? '#e6fffb' : '#f0f5ff'
                              }}>
                                <span style={{ 
                                  color: isCurrentUser ? '#52c41a' : '#722ed1',
                                  fontWeight: 600 
                                }}>
                                  {isCurrentUser ? '👤 You' : `👥 ${barrel.current_operator_name || 'Unknown'}`}
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
                </div>
              )}
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
                    <Option value="operator">Operator</Option>
                    <Option value="supervisor">Supervisor</Option>
                    <Option value="admin">Admin</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Manufacturing">Manufacturing</Option>
                    <Option value="Quality Control">Quality Control</Option>
                    <Option value="Engineering">Engineering</Option>
                    <Option value="IT">IT</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="Status" name="isActive" initialValue={true}>
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
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
                      <Option value="operator">Operator</Option>
                      <Option value="supervisor">Supervisor</Option>
                      <Option value="admin">Admin</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Department" name="department" rules={[{ required: true }]}>
                    <Select>
                      <Option value="Manufacturing">Manufacturing</Option>
                      <Option value="Quality Control">Quality Control</Option>
                      <Option value="Engineering">Engineering</Option>
                      <Option value="IT">IT</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item label="Status" name="isActive">
                <Select>
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
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
      </Content>
    </Layout>
  );
}

// --- MAIN APP COMPONENT ---
const { Header, Content, Sider } = Layout;
const { Option } = Select;

function AppContent({ onShowAdminPanel }: { onShowAdminPanel?: () => void }) {
  const [currentUser] = useState<User | null>(mockApiService.getCurrentUser());
  
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
  const [selectedStation, setSelectedStation] = useState<string>(assignedStation || '1');
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
      const [barrelsData, metricsData] = await Promise.all([
        mockApiService.getBarrels(),
        mockApiService.getMetrics()
      ]);
      setBarrels(barrelsData);
      setMetrics(metricsData);
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
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Caliber', dataIndex: 'caliber', key: 'caliber' },
    { title: 'Length (in)', dataIndex: 'length_inches', key: 'length_inches' },
    { title: 'Twist', dataIndex: 'twist_rate', key: 'twist_rate' },
    { title: 'Material', dataIndex: 'material', key: 'material' },
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
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (s: string) => <span>{s.replace(/_/g, ' ')}</span> 
    },
    { 
      title: 'Created', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: (d: string) => new Date(d).toLocaleString() 
    },
    {
      title: 'Begin Time',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (d?: string) => d ? new Date(d).toLocaleString() : 'N/A'
    },
    {
      title: 'End Time',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (d?: string) => d ? new Date(d).toLocaleString() : 'N/A'
    },
    {
      title: 'Operator',
      key: 'operator',
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
          return (
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartOperation(record.id)}
              disabled={activeBarrel !== null || isLoading}
              size="small"
            >
              Start
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
                  >
                    Pause
                  </Button>
                ) : (
                  <Button 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleResumeOperation(record.id)}
                    size="small"
                  >
                    Resume
                  </Button>
                )}
                <Button 
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleCompleteOperation(record.id)}
                  size="small"
                >
                  Complete
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

  // If user has no station assignments, show access denied screen (except for admins)
  if (!assignedStation && currentUser?.role !== 'admin') {
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" style={{ background: '#fff' }}>
        <div style={{ 
          height: 64, 
          margin: 16, 
          textAlign: 'center', 
          fontWeight: 700, 
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AppstoreOutlined style={{ fontSize: 32, color: '#1677ff', marginRight: 8 }} />
          MES Admin
        </div>
        <Menu mode="inline" selectedKeys={[selectedStation]} onClick={e => setSelectedStation(e.key)}>
          {stations.map(station => (
            <Menu.Item key={station.id} icon={<BarChartOutlined />}>
              {station.name}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: '#1677ff', 
          color: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            Rifle Barrel MES
            {/* Multi-tablet sync indicator */}
            <div style={{ 
              fontSize: 12, 
              fontWeight: 400, 
              background: syncConfig.enabled ? '#52c41a' : '#faad14',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4
            }}>
              {syncConfig.enabled ? '🔄 Multi-Tablet Sync ON' : '📱 Local Mode'}
            </div>
            {/* Tablet identifier */}
            <div style={{ 
              fontSize: 11, 
              fontWeight: 400, 
              background: '#0958d9',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: 3
            }}>
              {mockApiService.getTabletDisplayName(mockApiService.getTabletId())}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Sync Status */}
            <div style={{ 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center'
            }}>
              <div>🔄 Last Sync</div>
              <div style={{ fontWeight: 600 }}>
                {lastSync.toLocaleTimeString()}
              </div>
            </div>
            
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
                {currentUser?.fullName || 'Anonymous'}
              </span>
              <span style={{ opacity: 0.7 }}>
                ({currentUser?.role || 'guest'})
              </span>
              {currentUser && (() => {
                if (currentUser.role === 'admin') {
                  return (
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontSize: 11,
                      marginLeft: 4,
                      color: '#ffd700'
                    }}>
                      🔑 Full Access
                    </span>
                  );
                }
                
                const assignedStation = getUserAssignedStation();
                if (assignedStation) {
                  const station = stations.find(s => s.id === assignedStation);
                  return (
                    <span style={{ 
                      background: 'rgba(255,255,255,0.2)',
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontSize: 11,
                      marginLeft: 4
                    }}>
                      📍 {station?.name || `Station ${assignedStation}`}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
            
            {/* Admin Panel Access */}
            {currentUser?.role === 'admin' && (
              <Button 
                icon={<AppstoreOutlined />} 
                onClick={() => onShowAdminPanel?.()} 
                type="primary"
                style={{ background: '#722ed1', borderColor: '#722ed1' }}
              >
                Admin Panel
              </Button>
            )}
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadData} 
              loading={isLoading} 
              type="primary"
            >
              Refresh
            </Button>
            
            <Button 
              icon={<ExclamationCircleOutlined />} 
              onClick={handleLogout} 
              type="primary"
              ghost
            >
              Logout
            </Button>
          </div>
        </Header>
        
        <Content style={{ margin: 24 }}>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Total WIP" 
                  value={metrics?.total_wip || 0} 
                  prefix={<BarChartOutlined />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Completed Today" 
                  value={metrics?.completed_today || 0} 
                  prefix={<CheckCircleOutlined />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="In Progress" 
                  value={barrels.filter(b => b.status.includes('IN_PROGRESS')).length} 
                  prefix={<ClockCircleOutlined />} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                block 
                size="large" 
                onClick={() => setShowNewBarrelForm(true)}
              >
                New Barrel
              </Button>
            </Col>
          </Row>
          
          <Card 
            title={`${stations.find(s => s.id === selectedStation)?.name} Station`} 
            bordered={false} 
            style={{ marginBottom: 24 }}
          >
            <Table
              dataSource={getBarrelsForStation()}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={false}
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
                  <Option value=".308 Winchester">.308 Winchester</Option>
                  <Option value="6.5 Creedmoor">6.5 Creedmoor</Option>
                  <Option value=".223 Wylde">.223 Wylde</Option>
                  <Option value="6mm Creedmoor">6mm Creedmoor</Option>
                  <Option value=".300 Win Mag">.300 Win Mag</Option>
                  <Option value="6.5 PRC">6.5 PRC</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Length (inches)" name="length_inches" rules={[{ required: true }]}>
                <Input type="number" min={16} max={32} />
              </Form.Item>
              
              <Form.Item label="Twist Rate" name="twist_rate" rules={[{ required: true }]}>
                <Select>
                  <Option value="1:7">1:7</Option>
                  <Option value="1:8">1:8</Option>
                  <Option value="1:9">1:9</Option>
                  <Option value="1:10">1:10</Option>
                  <Option value="1:11">1:11</Option>
                  <Option value="1:12">1:12</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Material" name="material" rules={[{ required: true }]}>
                <Select>
                  <Option value="416R Stainless">416R Stainless</Option>
                  <Option value="4140 Chrome Moly">4140 Chrome Moly</Option>
                  <Option value="4150 Chrome Moly">4150 Chrome Moly</Option>
                  <Option value="17-4 Stainless">17-4 Stainless</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                </Select>
              </Form.Item>
              
              <Form.Item>
                <Button htmlType="submit" type="primary" loading={isLoading} block>
                  Create Barrel
                </Button>
              </Form.Item>
            </Form>
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
