// src/features/admin/UsersPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Typography, Space } from 'antd';
import { apiClient } from '../../api/client';
import { formatDateTime } from '../../utils/date';

const { Title, Text } = Typography;

export const UsersPage: React.FC = () => {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data;
    },
  });

  const columns = [
    {
      title: 'الاسم الكامل',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'البريد الإلكتروني',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'القسم',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (d: string) => d || 'الإدارة التنفيذية',
    },
    {
      title: 'الأدوار',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: any[]) => (
        <Space>
          {(roles || []).map((r: any, idx: number) => {
            const roleName = typeof r === 'string' ? r : r.name;
            const displayName =
              roleName === 'executive_director'
                ? 'المدير التنفيذي'
                : roleName === 'department_manager'
                ? 'مدير قسم'
                : 'موظف';
            return (
              <Tag color={roleName === 'executive_director' ? 'gold' : roleName === 'department_manager' ? 'cyan' : 'blue'} key={idx}>
                {displayName}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'حالة الحساب',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>{active ? 'نشط' : 'معطل'}</Tag>
      ),
    },
    {
      title: 'آخر تسجيل دخول',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (d: string) => (d ? formatDateTime(d) : 'لم يسجل دخول بعد'),
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: '#173F45' }}>
          إدارة موظفي ومستخدمي المنصة (8 حسابات)
        </Title>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={usersData || []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
    </Card>
  );
};
