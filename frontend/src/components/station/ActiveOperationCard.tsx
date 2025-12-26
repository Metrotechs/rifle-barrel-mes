/**
 * Active Operation Timer Card
 */

import React, { useState } from 'react';
import { Card, Button, Input } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatTime } from '../../lib/utils';

interface ActiveOperationCardProps {
  barrelId: string;
  stationName: string;
  elapsedTime: number;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  onComplete: (notes?: string) => void;
}

export function ActiveOperationCard({
  barrelId,
  stationName,
  elapsedTime,
  isActive,
  onPause,
  onResume,
  onComplete,
}: ActiveOperationCardProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    onComplete(notes || undefined);
    setNotes('');
    setShowNotes(false);
  };

  return (
    <Card
      title={`Active Operation - ${stationName} - Barrel #${barrelId}`}
      style={{
        marginBottom: 24,
        border: '2px solid #1677ff',
        backgroundColor: '#f6ffed',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '48px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#1677ff',
            marginBottom: 16,
          }}
        >
          {formatTime(elapsedTime)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {isActive ? (
            <Button size="large" icon={<PauseCircleOutlined />} onClick={onPause}>
              Pause
            </Button>
          ) : (
            <Button size="large" icon={<PlayCircleOutlined />} onClick={onResume}>
              Resume
            </Button>
          )}

          <Button
            type="link"
            onClick={() => setShowNotes(!showNotes)}
            style={{ alignSelf: 'center' }}
          >
            {showNotes ? 'Hide Notes' : 'Add Notes'}
          </Button>

          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleComplete}
          >
            Complete Operation
          </Button>
        </div>

        {showNotes && (
          <div style={{ marginTop: 16, maxWidth: 400, margin: '16px auto 0' }}>
            <Input.TextArea
              rows={3}
              placeholder="Add notes for this operation (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
