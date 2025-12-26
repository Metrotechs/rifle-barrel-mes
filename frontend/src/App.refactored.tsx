/**
 * Rifle Barrel MES Application
 * Main application entry point with clean component architecture
 */

import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/admin';
import { LoadingOverlay } from './components/common';
import './App.css';

// Create React Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchInterval: 10000,
      retry: 2,
    },
  },
});

// Custom Ant Design theme for MES
const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontSize: 14,
  },
};

/**
 * Main App Content - handles routing between views
 */
function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingOverlay message="Loading..." />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // Show admin panel if requested and user has permission
  if (showAdmin && (user.role === 'admin' || user.role === 'supervisor')) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  // Show main dashboard
  return (
    <Dashboard
      onShowAdminPanel={() => setShowAdmin(true)}
    />
  );
}

/**
 * Root App Component with providers
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
