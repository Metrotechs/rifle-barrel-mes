/**
 * Header Component
 */

import React from 'react';
import { Layout, Button } from 'antd';
import {
  AppstoreOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { mesApi } from '../../services/mesApi';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  title?: string;
  onRefresh?: () => void;
  onShowAdminPanel?: () => void;
  onShowBarrelTracking?: () => void;
  isLoading?: boolean;
  showAdminButton?: boolean;
  showTrackingButton?: boolean;
  backgroundColor?: string;
}

export function Header({
  title = 'Rifle Barrel MES',
  onRefresh,
  onShowAdminPanel,
  onShowBarrelTracking,
  isLoading = false,
  showAdminButton = false,
  showTrackingButton = true,
  backgroundColor = '#1677ff',
}: HeaderProps) {
  const { user, isImpersonating, originalUser, stopImpersonation, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
      window.location.reload();
    }
  };

  const handleStopImpersonation = async () => {
    await stopImpersonation();
    window.location.reload();
  };

  const assignedStations = user ? mesApi.getAssignedStations(user.id) : [];
  const stations = mesApi.getStations();

  return (
    <AntHeader
      style={{
        background: backgroundColor,
        color: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AppstoreOutlined />
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Impersonation indicator */}
        {isImpersonating && (
          <div
            style={{
              background: '#fa8c16',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🎭 IMPERSONATING: {user?.fullName}
            <Button
              size="small"
              onClick={handleStopImpersonation}
              style={{
                background: '#fff',
                color: '#fa8c16',
                border: 'none',
                height: 20,
                fontSize: 10,
                padding: '0 8px',
              }}
            >
              STOP
            </Button>
          </div>
        )}

        {/* User info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13,
          }}
        >
          <span>👤 {user?.fullName || 'Anonymous'}</span>
          <span style={{ opacity: 0.7 }}>({user?.role || 'guest'})</span>
          {isImpersonating && originalUser && (
            <span style={{ color: '#ffd666', fontSize: 11 }}>[Original: {originalUser.fullName}]</span>
          )}
          {user?.role === 'operator' && (
            <span
              style={{
                background:
                  assignedStations.length > 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                padding: '2px 6px',
                borderRadius: 10,
                fontSize: 11,
                marginLeft: 4,
                color: assignedStations.length > 0 ? '#22c55e' : '#ef4444',
              }}
            >
              📍{' '}
              {assignedStations.length > 0
                ? stations
                    .filter((s) => assignedStations.includes(s.id))
                    .map((s) => s.name)
                    .join(', ')
                : 'No Stations Assigned'}
            </span>
          )}
        </div>

        {showTrackingButton && onShowBarrelTracking && (
          <Button icon={<BarChartOutlined />} onClick={onShowBarrelTracking} type="primary" ghost>
            Barrel Tracking
          </Button>
        )}

        {showAdminButton && user?.role === 'admin' && onShowAdminPanel && (
          <Button
            icon={<AppstoreOutlined />}
            onClick={onShowAdminPanel}
            type="primary"
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            Admin Panel
          </Button>
        )}

        {onRefresh && (
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={isLoading} type="primary">
            Refresh
          </Button>
        )}

        <Button icon={<ExclamationCircleOutlined />} onClick={handleLogout} type="primary" ghost>
          Logout
        </Button>
      </div>
    </AntHeader>
  );
}
