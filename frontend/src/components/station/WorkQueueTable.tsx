/**
 * Work Queue Table Component
 * Displays barrels at the current station
 */

import React from 'react';
import { Table, Button, Card } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { SimpleBarrel } from '../../types/barrel';
import type { SimpleStation } from '../../types/station';
import { useAuth } from '../../context/AuthContext';
import { mesApi } from '../../services/mesApi';
import { formatTime, getPriorityColor } from '../../lib/utils';

interface WorkQueueTableProps {
  barrels: SimpleBarrel[];
  station: SimpleStation;
  activeBarrelId: string | null;
  isOperationActive: boolean;
  elapsedTime: number;
  isLoading: boolean;
  onStartOperation: (barrelId: string) => void;
  onPauseOperation: () => void;
  onResumeOperation: (barrelId: string) => void;
  onCompleteOperation: (barrelId: string) => void;
}

export function WorkQueueTable({
  barrels,
  station,
  activeBarrelId,
  isOperationActive,
  elapsedTime,
  isLoading,
  onStartOperation,
  onPauseOperation,
  onResumeOperation,
  onCompleteOperation,
}: WorkQueueTableProps) {
  const { canAccessStation } = useAuth();
  const hasAccess = canAccessStation(station.id);

  const columns = [
    {
      title: 'Barrel ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Caliber',
      dataIndex: 'caliber',
      key: 'caliber',
    },
    {
      title: 'Length',
      dataIndex: 'length_inches',
      key: 'length_inches',
      render: (value: number) => `${value}"`,
    },
    {
      title: 'Twist',
      dataIndex: 'twist_rate',
      key: 'twist_rate',
    },
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <span style={{ color: getPriorityColor(priority), fontWeight: 600 }}>{priority}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: SimpleBarrel) => {
        if (status.includes('IN_PROGRESS')) {
          const isCurrentUser = mesApi.isCurrentOperator(record);
          return (
            <span style={{ color: '#1677ff', fontWeight: 600 }}>
              🔧 In Progress
              {isCurrentUser && ` (${formatTime(elapsedTime)})`}
            </span>
          );
        }
        return <span style={{ color: '#faad14' }}>⏳ Pending</span>;
      },
    },
    {
      title: 'Operator',
      key: 'operator',
      render: (_: unknown, record: SimpleBarrel) => {
        if (record.current_operator_name) {
          const isCurrentUser = mesApi.isCurrentOperator(record);
          return (
            <span style={{ color: isCurrentUser ? '#52c41a' : '#faad14', fontWeight: 600 }}>
              {isCurrentUser ? '👤 You' : `👥 ${record.current_operator_name}`}
            </span>
          );
        }
        return <span style={{ color: '#999' }}>Available</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SimpleBarrel) => {
        const isOwner = mesApi.isCurrentOperator(record);
        const hasOwner = !!record.current_operator_id;

        if (record.status.includes('PENDING')) {
          return (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => onStartOperation(record.id)}
              disabled={activeBarrelId !== null || isLoading || !hasAccess}
              size="small"
              title={!hasAccess ? 'You are not authorized to operate this station' : 'Start operation'}
            >
              Start {!hasAccess && '🔒'}
            </Button>
          );
        }

        if (record.status.includes('IN_PROGRESS')) {
          if (isOwner) {
            return (
              <div style={{ display: 'flex', gap: 8 }}>
                {record.id === activeBarrelId && isOperationActive ? (
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={onPauseOperation}
                    size="small"
                    disabled={!hasAccess}
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={() => onResumeOperation(record.id)}
                    size="small"
                    disabled={!hasAccess}
                  >
                    Resume
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onCompleteOperation(record.id)}
                  size="small"
                  disabled={!hasAccess}
                >
                  Complete
                </Button>
              </div>
            );
          }

          if (hasOwner) {
            return (
              <span style={{ color: '#faad14', fontSize: 12, fontWeight: 600 }}>
                🔒 In Use by {record.current_operator_name || 'Unknown'}
              </span>
            );
          }

          return (
            <Button
              icon={<PlayCircleOutlined />}
              onClick={() => onResumeOperation(record.id)}
              size="small"
              disabled={activeBarrelId !== null && activeBarrelId !== record.id}
            >
              Resume
            </Button>
          );
        }

        return <span style={{ color: '#999' }}>Waiting...</span>;
      },
    },
  ];

  return (
    <Card title={`${station.name} Station`} variant="outlined">
      <Table
        dataSource={barrels}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: 'No barrels at this station.' }}
      />
    </Card>
  );
}
