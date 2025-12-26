/**
 * Login Screen Component
 */

import React, { useState } from 'react';
import { Card, Button, Input, Form, notification } from 'antd';
import { PlayCircleOutlined, ExclamationCircleOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { mesApi } from '../../services/mesApi';

export function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const success = await login(values.username, values.password);
      if (success) {
        const user = mesApi.getCurrentUser();
        const assignedStations = user ? mesApi.getAssignedStations(user.id) : [];
        const stations = mesApi.getStations();

        let stationMessage = '';
        if (user?.role === 'admin') {
          stationMessage = 'Administrator access - full system control enabled.';
        } else if (assignedStations.length > 0) {
          const primaryStation = stations.find((s) => s.id === assignedStations[0]);
          stationMessage = `Directing you to ${primaryStation?.name} station.`;
        } else {
          stationMessage = 'WARNING: No station assigned - contact administrator for access.';
        }

        if (user?.role === 'admin' || assignedStations.length > 0) {
          notification.success({
            message: 'Login Successful',
            description: `Welcome back, ${user?.fullName}! ${stationMessage}`,
          });
        } else {
          notification.warning({
            message: 'Login Successful - Access Limited',
            description: `Welcome back, ${user?.fullName}! ${stationMessage}`,
            duration: 8,
          });
        }
        window.location.reload();
      } else {
        notification.error({
          message: 'Login Failed',
          description: 'Invalid username or password. Please try again.',
        });
      }
    } catch (error) {
      notification.error({
        message: 'Login Error',
        description: 'An error occurred during login. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const users = mesApi.getUsers();
  const stationNames = [
    'Drilling', 'Reaming', 'Rifling', 'Heat Treat', 'Lapping',
    'Honing', 'Fluting', 'Chambering', 'Inspection', 'Finishing', 'Final QC'
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <AppstoreOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#1677ff' }}>
            Rifle Barrel MES
          </h1>
          <p style={{ color: '#666', margin: '8px 0 0 0' }}>Manufacturing Execution System</p>
        </div>

        <Form layout="vertical" onFinish={handleLogin} autoComplete="off">
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username!' }]}
          >
            <Input prefix={<PlayCircleOutlined />} placeholder="Enter username" size="large" />
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
          <Button type="link" onClick={() => setShowUsers(!showUsers)} size="small">
            {showUsers ? 'Hide' : 'Show'} Demo Users
          </Button>
        </div>

        {showUsers && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            <strong>Demo Users (password: any 3+ chars):</strong>
            <div
              style={{
                margin: '8px 0 0 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px',
              }}
            >
              {users
                .filter((u) => u.role === 'operator' && u.username !== 'testuser')
                .map((user, index) => {
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

        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            padding: 12,
            background: '#e6f7ff',
            borderRadius: 6,
            fontSize: 11,
            color: '#1677ff',
          }}
        >
          🔐 Secure operator authentication ensures full traceability
        </div>
      </Card>
    </div>
  );
}
