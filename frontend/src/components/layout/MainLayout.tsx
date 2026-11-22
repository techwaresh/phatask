// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Badge,
  Dropdown,
  Avatar,
  Space,
  Typography,
  Drawer,
  List,
  Divider,
} from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  AuditOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  const isManager = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'department_manager')
    : false;

  // استعلام الإشعارات غير المقروءة
  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data.data.unreadCount;
    },
    refetchInterval: 30000,
  });

  // استعلام أحدث الإشعارات
  const { data: notificationsData } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?limit=5');
      return res.data.data.items;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
    },
  });

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'لوحة التحكم',
    },
    {
      key: '/plans',
      icon: <CalendarOutlined />,
      label: 'الخطط',
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: 'المهام',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'التقارير',
    },
    ...(isExecutive || isManager
      ? [
          {
            key: '/approvals',
            icon: <AuditOutlined />,
            label: 'الاعتمادات',
          },
        ]
      : []),
    {
      key: '/departments',
      icon: <ApartmentOutlined />,
      label: 'الأقسام',
    },
    ...(isExecutive
      ? [
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: 'المستخدمون',
          },
          {
            key: '/admin',
            icon: <SettingOutlined />,
            label: 'إدارة النظام',
          },
        ]
      : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    setMobileDrawerOpen(false);
  };

  const notificationMenu = (
    <div style={{ width: 320, padding: 12, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>الإشعارات</Text>
        <Button type="link" size="small" onClick={() => markAllReadMutation.mutate()}>
          تعليم الكل كمقروء
        </Button>
      </div>
      <Divider style={{ margin: '4px 0' }} />
      <List
        size="small"
        dataSource={notificationsData || []}
        locale={{ emptyText: 'لا توجد إشعارات جديدة' }}
        renderItem={(item: any) => (
          <List.Item
            style={{
              padding: '8px 4px',
              backgroundColor: item.is_read ? 'transparent' : '#f0f9f8',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (item.related_entity_type === 'plan') navigate('/plans');
              if (item.related_entity_type === 'task') navigate('/tasks');
              if (item.related_entity_type === 'report') navigate('/reports');
            }}
          >
            <List.Item.Meta
              title={<span style={{ fontSize: 13, fontWeight: item.is_read ? 'normal' : 'bold' }}>{item.title}</span>}
              description={<span style={{ fontSize: 12, color: '#666' }}>{item.body}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block' }}>{user?.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Text>
        </div>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'تسجيل الخروج',
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
      {/* Desktop Sider */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#173F45',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
        className="desktop-sider"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: '#258579',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              ب
            </div>
            {!collapsed && (
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>منصة بصمة</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>BWMS v1.0</div>
              </div>
            )}
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 12, background: 'transparent' }}
        />
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        title="نظام إدارة العمل بصمة"
        placement="right"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0, background: '#173F45' }, header: { background: '#173F45', color: '#fff' } }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: 'transparent' }}
        />
      </Drawer>

      <Layout>
        {/* Top Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            zIndex: 1,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                if (window.innerWidth < 992) {
                  setMobileDrawerOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              style={{ fontSize: 16 }}
            />
            <Text strong style={{ fontSize: 16, color: '#173F45' }}>
              مؤسسة بصمة للأعمال الإنسانية
            </Text>
          </Space>

          <Space orientation="horizontal" size="middle">
            {/* Notification Bell */}
            <Dropdown dropdownRender={() => notificationMenu} trigger={['click']} placement="bottomLeft">
              <Badge count={unreadData || 0} size="small" offset={[-4, 4]}>
                <Button
                  shape="circle"
                  icon={<BellOutlined />}
                  style={{ border: 'none', background: '#F4F6F7' }}
                />
              </Badge>
            </Dropdown>

            {/* User Profile */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomLeft">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: '#F4F6F7' }}>
                <Avatar style={{ backgroundColor: '#258579' }} icon={<UserOutlined />} />
                <div style={{ textAlign: 'right', display: 'none' }} className="user-text-badge">
                  <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.2 }}>
                    {user?.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {isExecutive ? 'المدير التنفيذي' : isManager ? 'مدير قسم' : 'موظف'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content Area */}
        <Content
          style={{
            margin: '20px 24px',
            padding: '24px',
            background: '#F4F6F7',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
