/**
 * Dashboard Metrics Cards
 */

import React from 'react';
import { Row, Col, Card, Statistic, Button } from 'antd';
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { DashboardMetrics } from '../../types/metrics';

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  inProgressCount: number;
  onNewBarrel: () => void;
}

export function MetricsCards({ metrics, inProgressCount, onNewBarrel }: MetricsCardsProps) {
  return (
    <Row gutter={24} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic title="Total WIP" value={metrics?.total_wip || 0} prefix={<BarChartOutlined />} />
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
            value={inProgressCount}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Button type="primary" icon={<PlusOutlined />} block size="large" onClick={onNewBarrel}>
          New Barrel
        </Button>
      </Col>
    </Row>
  );
}
