/**
 * Station Selector Component
 * Displays a list of stations in the sidebar for selection
 */

import React from 'react';
import { Layout, Menu } from 'antd';
import type { SimpleStation } from '../../types/station';
import { useAuth } from '../../context/AuthContext';

const { Sider } = Layout;

interface StationSelectorProps {
  stations: SimpleStation[];
  selectedStation: string;
  onSelectStation: (stationId: string) => void;
  metrics?: {
    stations: Array<{
      station_id: string;
      pending_count: number;
      in_progress_count: number;
    }>;
  };
}

export function StationSelector({
  stations,
  selectedStation,
  onSelectStation,
  metrics,
}: StationSelectorProps) {
  const { canAccessStation, user } = useAuth();

  const getStationLabel = (station: SimpleStation) => {
    const stationMetrics = metrics?.stations.find((s) => s.station_id === station.id);
    const pending = stationMetrics?.pending_count || 0;
    const inProgress = stationMetrics?.in_progress_count || 0;
    const hasAccess = canAccessStation(station.id);

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ opacity: hasAccess ? 1 : 0.5 }}>
          {station.name}
          {!hasAccess && ' 🔒'}
        </span>
        <span>
          {pending > 0 && (
            <span
              style={{
                background: '#faad14',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                marginRight: 4,
              }}
            >
              {pending}
            </span>
          )}
          {inProgress > 0 && (
            <span
              style={{
                background: '#1677ff',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              {inProgress}
            </span>
          )}
        </span>
      </div>
    );
  };

  const menuItems = stations.map((station) => ({
    key: station.id,
    label: getStationLabel(station),
  }));

  // For operators, filter to only show accessible stations (optional - show all with lock icon instead)
  const visibleStations = user?.role === 'operator' ? stations : stations;

  return (
    <Sider width={220} style={{ background: '#fff' }}>
      <div
        style={{
          padding: '16px',
          fontWeight: 600,
          fontSize: 16,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        Workstations
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedStation]}
        onClick={(e) => onSelectStation(e.key)}
        items={visibleStations.map((station) => ({
          key: station.id,
          label: getStationLabel(station),
        }))}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
}
