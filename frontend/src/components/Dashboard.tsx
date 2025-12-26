/**
 * Main Dashboard Component
 * The primary interface for station operators
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Layout, notification, Modal, Table, Button } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useBarrels, useMetrics, useStations, useOperationTimer, useBarrelTracking } from '../hooks/useData';
import { mesApi } from '../services/mesApi';
import { stationNameToStatus } from '../lib/utils';
import { Header } from './common/Header';
import { AccessDeniedScreen } from './common/AccessDeniedScreen';
import { LoadingOverlay } from './common/LoadingOverlay';
import {
  StationSelector,
  WorkQueueTable,
  NewBarrelModal,
  MetricsCards,
  ActiveOperationCard,
} from './station';

const { Content } = Layout;

interface DashboardProps {
  onShowAdminPanel?: () => void;
}

export function Dashboard({ onShowAdminPanel }: DashboardProps) {
  const { user, canAccessStation, getAssignedStations } = useAuth();
  const { stations } = useStations();
  const { barrels, isLoading, refresh, createBarrel, startOperation, completeOperation } = useBarrels();
  const { metrics, refresh: refreshMetrics } = useMetrics();
  const { trackingData, refresh: refreshTracking } = useBarrelTracking();

  // Determine initial station based on user's assignments
  const assignedStations = getAssignedStations();
  const initialStation = assignedStations[0] || (user?.role !== 'operator' ? '1' : null);

  const [selectedStation, setSelectedStation] = useState<string>(initialStation || '1');
  const [activeBarrelId, setActiveBarrelId] = useState<string | null>(null);
  const [isOperationActive, setIsOperationActive] = useState(false);
  const [showNewBarrelForm, setShowNewBarrelForm] = useState(false);
  const [showBarrelTracking, setShowBarrelTracking] = useState(false);
  const [operationNotes, setOperationNotes] = useState('');

  const { elapsedTime, reset: resetTimer } = useOperationTimer(isOperationActive);

  // If operator has no assigned stations, show access denied
  if (user?.role === 'operator' && !initialStation) {
    return <AccessDeniedScreen />;
  }

  // Get barrels for current station
  const getBarrelsForStation = useCallback(() => {
    const station = stations.find((s) => s.id === selectedStation);
    if (!station) return [];
    const stationStatus = stationNameToStatus(station.name);
    const filteredBarrels = barrels.filter(
      (b) => b.status === `${stationStatus}_PENDING` || b.status === `${stationStatus}_IN_PROGRESS`
    );
    return filteredBarrels.sort((a, b) => {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [selectedStation, barrels, stations]);

  const currentStation = stations.find((s) => s.id === selectedStation);

  // Operation handlers
  const handleStartOperation = async (barrelId: string) => {
    if (!currentStation) return;
    try {
      await startOperation(barrelId, currentStation.name);
      setActiveBarrelId(barrelId);
      setIsOperationActive(true);
      notification.success({
        message: 'Operation Started',
        description: `Started working on Barrel #${barrelId} at ${currentStation.name}`,
      });
    } catch (error) {
      notification.error({
        message: 'Failed to Start Operation',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handlePauseOperation = () => {
    setIsOperationActive(false);
    notification.info({ message: 'Operation Paused' });
  };

  const handleResumeOperation = (barrelId: string) => {
    setActiveBarrelId(barrelId);
    setIsOperationActive(true);
    notification.info({ message: 'Operation Resumed' });
  };

  const handleCompleteOperation = async (barrelId: string, notes?: string) => {
    try {
      await completeOperation(barrelId, notes);
      setActiveBarrelId(null);
      setIsOperationActive(false);
      resetTimer();
      setOperationNotes('');
      notification.success({
        message: 'Operation Completed',
        description: `Barrel #${barrelId} moved to next station`,
      });
    } catch (error) {
      notification.error({
        message: 'Failed to Complete Operation',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleCreateBarrel = async (data: any) => {
    try {
      const newBarrel = await createBarrel(data);
      setShowNewBarrelForm(false);
      notification.success({
        message: 'Barrel Created',
        description: `Barrel #${newBarrel.id} registered and ready for drilling`,
      });
    } catch (error) {
      notification.error({
        message: 'Failed to Create Barrel',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refresh(), refreshMetrics(), refreshTracking()]);
  };

  // Validate station access when selection changes
  useEffect(() => {
    if (selectedStation && !canAccessStation(selectedStation) && user?.role === 'operator') {
      const firstAccessible = assignedStations[0];
      if (firstAccessible) {
        setSelectedStation(firstAccessible);
        notification.warning({
          message: 'Station Access Restricted',
          description: `Redirected to your assigned station.`,
        });
      }
    }
  }, [selectedStation, canAccessStation, assignedStations, user?.role]);

  const inProgressCount = barrels.filter((b) => b.status.includes('IN_PROGRESS')).length;
  const currentBarrel = activeBarrelId ? barrels.find((b) => b.id === activeBarrelId) : null;
  const isCurrentUserOperation = currentBarrel && mesApi.isCurrentOperator(currentBarrel);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        onRefresh={handleRefresh}
        onShowAdminPanel={onShowAdminPanel}
        onShowBarrelTracking={() => setShowBarrelTracking(true)}
        isLoading={isLoading}
        showAdminButton={user?.role === 'admin'}
      />

      <Layout>
        <StationSelector
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
          metrics={metrics || undefined}
        />

        <Content style={{ margin: 24 }}>
          {/* Security warnings */}
          {user?.role === 'operator' && !canAccessStation(selectedStation) && (
            <div
              style={{
                background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #f59e0b',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: '#d97706', marginBottom: 8 }}>
                ⚠️ Unauthorized Station Selected
              </div>
              <div style={{ color: '#92400e', fontSize: 14 }}>
                You are viewing a station you're not authorized to operate.
              </div>
            </div>
          )}

          <MetricsCards
            metrics={metrics}
            inProgressCount={inProgressCount}
            onNewBarrel={() => setShowNewBarrelForm(true)}
          />

          {currentStation && (
            <WorkQueueTable
              barrels={getBarrelsForStation()}
              station={currentStation}
              activeBarrelId={activeBarrelId}
              isOperationActive={isOperationActive}
              elapsedTime={elapsedTime}
              isLoading={isLoading}
              onStartOperation={handleStartOperation}
              onPauseOperation={handlePauseOperation}
              onResumeOperation={handleResumeOperation}
              onCompleteOperation={handleCompleteOperation}
            />
          )}

          {activeBarrelId && isCurrentUserOperation && currentStation && (
            <ActiveOperationCard
              barrelId={activeBarrelId}
              stationName={currentStation.name}
              elapsedTime={elapsedTime}
              isActive={isOperationActive}
              onPause={handlePauseOperation}
              onResume={() => handleResumeOperation(activeBarrelId)}
              onComplete={(notes) => handleCompleteOperation(activeBarrelId, notes)}
            />
          )}
        </Content>
      </Layout>

      <NewBarrelModal
        visible={showNewBarrelForm}
        onClose={() => setShowNewBarrelForm(false)}
        onSubmit={handleCreateBarrel}
        isLoading={isLoading}
      />

      {/* Barrel Tracking Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChartOutlined />
            Barrel Process Tracking
          </div>
        }
        open={showBarrelTracking}
        onCancel={() => setShowBarrelTracking(false)}
        footer={null}
        width={900}
      >
        <Table
          dataSource={trackingData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
            { title: 'Caliber', dataIndex: 'caliber', key: 'caliber' },
            {
              title: 'Station',
              dataIndex: 'currentStation',
              key: 'currentStation',
              render: (station: string, record: any) => (
                <span style={{ fontWeight: record.isActive ? 600 : 400 }}>
                  {station}
                  {record.isActive && ' 🔧'}
                </span>
              ),
            },
            {
              title: 'Progress',
              dataIndex: 'progressPercentage',
              key: 'progress',
              render: (pct: number) => (
                <div style={{ width: 100 }}>
                  <div
                    style={{
                      background: '#f0f0f0',
                      borderRadius: 4,
                      height: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        background: pct === 100 ? '#52c41a' : '#1677ff',
                        width: `${pct}%`,
                        height: '100%',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, textAlign: 'center' }}>{pct}%</div>
                </div>
              ),
            },
            {
              title: 'Operator',
              dataIndex: 'current_operator_name',
              key: 'operator',
              render: (name: string) =>
                name ? <span style={{ color: '#1677ff' }}>👤 {name}</span> : '—',
            },
          ]}
        />
      </Modal>

      <LoadingOverlay visible={isLoading && barrels.length === 0} />
    </Layout>
  );
}
