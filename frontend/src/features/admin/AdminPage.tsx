// src/features/admin/AdminPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Typography, Tabs } from 'antd';
import { apiClient } from '../../api/client';
import { formatDateTime } from '../../utils/date';

const { Title, Text } = Typography;

export const AdminPage: React.FC = () => {
  // سجل النشاطات
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/activity-logs?limit=50');
      return res.data.data.items;
    },
  });

  // إعدادات النظام
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/system-settings');
      return res.data.data;
    },
  });

  const logColumns = [
    {
      title: 'المستخدم',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name || 'النظام'}</Text>
          <div style={{ fontSize: 11, color: '#888' }}>{record.user_email}</div>
        </div>
      ),
    },
    {
      title: 'نوع الإجراء',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="cyan">{action}</Tag>,
    },
    {
      title: 'الوحدة / الكيان',
      dataIndex: 'entity_type',
      key: 'entity_type',
    },
    {
      title: 'التفاصيل',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'التاريخ والوقت',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => formatDateTime(d),
    },
  ];

  const settingsColumns = [
    {
      title: 'المفتاح البرمجي',
      dataIndex: 'key',
      key: 'key',
      render: (k: string) => <Text code>{k}</Text>,
    },
    {
      title: 'الوصف',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'القيمة الحالية',
      dataIndex: 'value',
      key: 'value',
      render: (v: string) => <Text strong>{v}</Text>,
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: '#173F45' }}>
          إدارة النظام وسجل التدقيق
        </Title>
      }
      bordered={false}
    >
      <Tabs
        defaultActiveKey="logs"
        items={[
          {
            key: 'logs',
            label: 'سجل النشاطات والعمليات',
            children: (
              <Table
                columns={logColumns}
                dataSource={logsData || []}
                rowKey="id"
                loading={logsLoading}
                pagination={{ pageSize: 15 }}
              />
            ),
          },
          {
            key: 'settings',
            label: 'إعدادات النظام المؤسسي',
            children: (
              <Table
                columns={settingsColumns}
                dataSource={settingsData || []}
                rowKey="id"
                loading={settingsLoading}
                pagination={false}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};
