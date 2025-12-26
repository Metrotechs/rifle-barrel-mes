/**
 * Access Denied Screen
 * Shown when an operator has no station assignments
 */

import React from 'react';
import { Layout, Card, Typography } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { mesApi } from '../../services/mesApi';

const { Title } = Typography;

export function AccessDeniedScreen() {
  const { user } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: 24,
        }}
      >
        <Card
          style={{
            maxWidth: 500,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }}>🚫</div>
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

          <div
            style={{
              background: '#f9f9f9',
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
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

          <div
            style={{
              fontSize: 13,
              color: '#999',
              borderTop: '1px solid #eee',
              paddingTop: 16,
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <strong>User:</strong> {user?.fullName || 'Unknown'}
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>Role:</strong> {user?.role || 'Unknown'}
            </div>
            <div>
              <strong>Tablet:</strong> {mesApi.getTabletDisplayName(mesApi.getTabletId())}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
