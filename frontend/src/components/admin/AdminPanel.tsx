/**
 * Admin Panel Component
 * Administration interface for managing users, stations, and viewing analytics
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Menu, Card, Button, Table, Modal, Form, Input, Select, Row, Col, notification, Statistic } from 'antd';
import {
  AppstoreOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useBarrels, useSystemAnalytics, useStations } from '../../hooks/useData';
import { mesApi } from '../../services/mesApi';
import type { User } from '../../types/user';
import type { StationAssignment } from '../../types/station';

const { Header, Content, Sider } = Layout;

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { user, isImpersonating, originalUser, stopImpersonation, logout, impersonate } = useAuth();
  const { stations } = useStations();
  const { barrels, refresh: refreshBarrels, isLoading } = useBarrels();
  const { analytics, refresh: refreshAnalytics } = useSystemAnalytics();

  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<StationAssignment[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(() => {
    const allUsers = mesApi.getUsers();
    // Supervisors can only see operators
    if (user?.role === 'supervisor') {
      setUsers(allUsers.filter((u) => u.role === 'operator' || u.id === user.id));
    } else {
      setUsers(allUsers);
    }
    setAssignments(mesApi.getStationAssignments());
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = mesApi.onDataChange(loadData);
    return unsubscribe;
  }, [loadData]);

  const handleRefresh = async () => {
    loadData();
    await Promise.all([refreshBarrels(), refreshAnalytics()]);
  };

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

  const handleCreateUser = async (values: any) => {
    try {
      await mesApi.createUser(values);
      notification.success({ message: 'User created successfully!' });
      setShowUserForm(false);
      form.resetFields();
      loadData();
    } catch (error) {
      notification.error({ message: 'Failed to create user' });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await mesApi.updateUser(userId, updates);
      notification.success({ message: 'User updated successfully!' });
      setEditingUser(null);
      loadData();
    } catch (error) {
      notification.error({ message: 'Failed to update user' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      onOk: async () => {
        try {
          await mesApi.deleteUser(userId);
          notification.success({ message: 'User deleted successfully!' });
          loadData();
        } catch (error) {
          notification.error({ message: 'Failed to delete user' });
        }
      },
    });
  };

  const handleImpersonateUser = async (targetUser: User) => {
    Modal.confirm({
      title: 'Impersonate User',
      content: (
        <div>
          <p>You are about to impersonate: <strong>{targetUser.fullName}</strong></p>
          <p style={{ color: '#fa8c16', marginTop: 12 }}>
            ⚠️ Use "Stop Impersonation" to return to your account.
          </p>
        </div>
      ),
      onOk: async () => {
        const success = await impersonate(targetUser.id);
        if (success) {
          notification.success({ message: `Now impersonating ${targetUser.fullName}` });
          window.location.reload();
        } else {
          notification.error({ message: 'Impersonation failed' });
        }
      },
    });
  };

  const handleAssignStation = async (userId: string, stationId: string) => {
    try {
      await mesApi.assignUserToStation(userId, stationId);
      notification.success({ message: 'Station assigned successfully!' });
      loadData();
    } catch (error) {
      notification.error({ message: 'Failed to assign station' });
    }
  };

  const userColumns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Full Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
          {isActive ? '✓ Active' : '✗ Inactive'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => setEditingUser(record)}>
            Edit
          </Button>
          {record.role !== 'admin' && (
            <Button size="small" onClick={() => handleImpersonateUser(record)}>
              Impersonate
            </Button>
          )}
          <Button size="small" danger onClick={() => handleDeleteUser(record.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const stationColumns = [
    { title: 'Station', dataIndex: 'name', key: 'name' },
    { title: 'Sequence', dataIndex: 'sequence', key: 'sequence' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Assigned Operator',
      key: 'operator',
      render: (_: unknown, record: any) => {
        const assignment = assignments.find((a) => a.stationId === record.id && a.isActive);
        const assignedUser = assignment ? users.find((u) => u.id === assignment.userId) : null;
        const availableUsers = users.filter((u) => u.role === 'operator');

        return (
          <Select
            style={{ width: 200 }}
            value={assignedUser?.id}
            onChange={(userId) => handleAssignStation(userId, record.id)}
            placeholder="Select operator"
          >
            {availableUsers.map((u) => (
              <Select.Option key={u.id} value={u.id}>
                {u.fullName}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#722ed1',
          color: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined />
          Admin Panel
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isImpersonating && (
            <div
              style={{
                background: '#fa8c16',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              🎭 IMPERSONATING: {user?.fullName}
              <Button
                size="small"
                onClick={handleStopImpersonation}
                style={{ background: '#fff', color: '#fa8c16', border: 'none', height: 20 }}
              >
                STOP
              </Button>
            </div>
          )}
          <span style={{ color: '#fff' }}>👤 {user?.fullName}</span>
          <Button icon={<BarChartOutlined />} onClick={onBack} type="primary">
            Back to MES
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading} type="primary" ghost>
            Refresh
          </Button>
          <Button icon={<ExclamationCircleOutlined />} onClick={handleLogout} type="primary" ghost>
            Logout
          </Button>
        </div>
      </Header>

      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            onClick={(e) => setActiveTab(e.key)}
            items={[
              { key: 'users', icon: <UserOutlined />, label: 'Users' },
              { key: 'stations', icon: <SettingOutlined />, label: 'Stations' },
              { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics' },
            ]}
          />
        </Sider>

        <Content style={{ margin: 24 }}>
          {activeTab === 'users' && (
            <Card
              title="User Management"
              extra={
                <Button type="primary" onClick={() => setShowUserForm(true)}>
                  Add User
                </Button>
              }
            >
              <Table dataSource={users} columns={userColumns} rowKey="id" />
            </Card>
          )}

          {activeTab === 'stations' && (
            <Card title="Station Assignments">
              <Table dataSource={stations} columns={stationColumns} rowKey="id" pagination={false} />
            </Card>
          )}

          {activeTab === 'analytics' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic title="Total Users" value={analytics?.totalUsers || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="Active Operators" value={analytics?.activeOperators || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="Total Operations" value={analytics?.totalOperations || 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic title="Barrels in WIP" value={barrels.filter((b) => !b.status.includes('COMPLETED')).length} />
                  </Card>
                </Col>
              </Row>

              <Card title="Active Operations">
                {barrels.filter((b) => b.status.includes('IN_PROGRESS')).length > 0 ? (
                  <Row gutter={16}>
                    {barrels
                      .filter((b) => b.status.includes('IN_PROGRESS'))
                      .map((barrel) => (
                        <Col span={8} key={barrel.id}>
                          <Card size="small" style={{ border: '2px solid #722ed1', background: '#f9f0ff' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#722ed1' }}>
                                Barrel #{barrel.id}
                              </div>
                              <div style={{ fontSize: 13, color: '#666' }}>
                                {barrel.caliber} • {barrel.length_inches}"
                              </div>
                              <div style={{ marginTop: 8, color: '#722ed1' }}>
                                👤 {barrel.current_operator_name || 'Unknown'}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                  </Row>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                    No active operations
                  </div>
                )}
              </Card>
            </div>
          )}
        </Content>
      </Layout>

      {/* New User Modal */}
      <Modal
        title="Add New User"
        open={showUserForm}
        onCancel={() => setShowUserForm(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="operator">Operator</Select.Option>
                  <Select.Option value="supervisor">Supervisor</Select.Option>
                  <Select.Option value="admin">Admin</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Manufacturing">Manufacturing</Select.Option>
                  <Select.Option value="Quality Control">Quality Control</Select.Option>
                  <Select.Option value="IT">IT</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="Status" initialValue={true}>
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Create User
          </Button>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        footer={null}
      >
        {editingUser && (
          <Form
            layout="vertical"
            initialValues={editingUser}
            onFinish={(values) => handleUpdateUser(editingUser.id, values)}
          >
            <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="role" label="Role">
                  <Select>
                    <Select.Option value="operator">Operator</Select.Option>
                    <Select.Option value="supervisor">Supervisor</Select.Option>
                    <Select.Option value="admin">Admin</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department" label="Department">
                  <Select>
                    <Select.Option value="Manufacturing">Manufacturing</Select.Option>
                    <Select.Option value="Quality Control">Quality Control</Select.Option>
                    <Select.Option value="IT">IT</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="isActive" label="Status">
              <Select>
                <Select.Option value={true}>Active</Select.Option>
                <Select.Option value={false}>Inactive</Select.Option>
              </Select>
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update User
            </Button>
          </Form>
        )}
      </Modal>
    </Layout>
  );
}
