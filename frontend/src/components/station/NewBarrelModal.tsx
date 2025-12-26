/**
 * New Barrel Form Modal
 */

import React from 'react';
import { Modal, Form, Input, Select, Row, Col } from 'antd';
import type { CreateBarrelInput, Priority } from '../../types/barrel';

interface NewBarrelModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBarrelInput) => void;
  isLoading: boolean;
}

export function NewBarrelModal({ visible, onClose, onSubmit, isLoading }: NewBarrelModalProps) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch {
      // Validation failed
    }
  };

  return (
    <Modal
      title="Register New Barrel"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={isLoading}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          caliber: '.308 Winchester',
          length_inches: 24,
          twist_rate: '1:10',
          material: '416R Stainless',
          priority: 'Medium' as Priority,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Caliber"
              name="caliber"
              rules={[{ required: true, message: 'Please select caliber' }]}
            >
              <Select>
                <Select.Option value=".308 Winchester">.308 Winchester</Select.Option>
                <Select.Option value="6.5 Creedmoor">6.5 Creedmoor</Select.Option>
                <Select.Option value=".223 Wylde">.223 Wylde</Select.Option>
                <Select.Option value=".300 Win Mag">.300 Win Mag</Select.Option>
                <Select.Option value="6mm GT">6mm GT</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Length (inches)"
              name="length_inches"
              rules={[{ required: true, message: 'Please enter length' }]}
            >
              <Select>
                <Select.Option value={16}>16"</Select.Option>
                <Select.Option value={18}>18"</Select.Option>
                <Select.Option value={20}>20"</Select.Option>
                <Select.Option value={22}>22"</Select.Option>
                <Select.Option value={24}>24"</Select.Option>
                <Select.Option value={26}>26"</Select.Option>
                <Select.Option value={28}>28"</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Twist Rate"
              name="twist_rate"
              rules={[{ required: true, message: 'Please select twist rate' }]}
            >
              <Select>
                <Select.Option value="1:7">1:7</Select.Option>
                <Select.Option value="1:8">1:8</Select.Option>
                <Select.Option value="1:9">1:9</Select.Option>
                <Select.Option value="1:10">1:10</Select.Option>
                <Select.Option value="1:11">1:11</Select.Option>
                <Select.Option value="1:12">1:12</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Material"
              name="material"
              rules={[{ required: true, message: 'Please select material' }]}
            >
              <Select>
                <Select.Option value="416R Stainless">416R Stainless</Select.Option>
                <Select.Option value="4140 Chrome Moly">4140 Chrome Moly</Select.Option>
                <Select.Option value="4150 Chrome Moly">4150 Chrome Moly</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: 'Please select priority' }]}
        >
          <Select>
            <Select.Option value="High">High</Select.Option>
            <Select.Option value="Medium">Medium</Select.Option>
            <Select.Option value="Low">Low</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
