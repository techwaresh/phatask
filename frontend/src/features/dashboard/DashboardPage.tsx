// src/features/dashboard/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  List,
  Progress,
  Skeleton,
} from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../../utils/date';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  // جلب إحصائيات لوحة التحكم الحقيقية من API
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats', isExecutive],
    queryFn: async () => {
      const endpoint = isExecutive ? '/dashboard/executive' : '/dashboard/employee';
      const res = await apiClient.get(endpoint);
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // لوحة المدير التنفيذي
  // ─────────────────────────────────────────────────────────────────────────────
  if (isExecutive) {
    const cards = statsData?.cards || {};
    const departments = statsData?.departments || [];
    const activities = statsData?.recentActivities || [];

    const deptColumns = [
      {
        title: 'القسم',
        dataIndex: 'name',
        key: 'name',
        render: (text: string) => <Text strong>{text}</Text>,
      },
      {
        title: 'مدير القسم',
        dataIndex: 'managerName',
        key: 'managerName',
        render: (name: string) => (
          <Tag color={name.includes('بدون مدير') ? 'orange' : 'cyan'}>{name}</Tag>
        ),
      },
      {
        title: 'عدد الموظفين',
        dataIndex: 'memberCount',
        key: 'memberCount',
        render: (count: number) => <Tag color="blue">{count} موظف</Tag>,
      },
      {
        title: 'إجمالي المهام',
        dataIndex: 'totalTasks',
        key: 'totalTasks',
      },
      {
        title: 'المهام المنجزة',
        dataIndex: 'completedTasks',
        key: 'completedTasks',
      },
      {
        title: 'متوسط الإنجاز',
        dataIndex: 'avgCompletion',
        key: 'avgCompletion',
        render: (rate: number) => (
          <Progress percent={rate} size="small" strokeColor="#258579" />
        ),
      },
    ];

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#173F45' }}>
            لوحة الإدارة التنفيذية
          </Title>
          <Text type="secondary">
            نظرة عامة شاملة على أداء موظفي وأقسام مؤسسة بصمة
          </Text>
        </div>

        {/* بطاقات الإحصاءات */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <Card bordered={false} style={{ borderRight: '4px solid #173F45' }}>
              <Statistic
                title="إجمالي الموظفين"
                value={cards.totalEmployees || 0}
                prefix={<TeamOutlined style={{ color: '#173F45' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card bordered={false} style={{ borderRight: '4px solid #258579' }}>
              <Statistic
                title="إجمالي المهام"
                value={cards.totalTasks || 0}
                prefix={<ClockCircleOutlined style={{ color: '#258579' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card bordered={false} style={{ borderRight: '4px solid #2e7d32' }}>
              <Statistic
                title="المهام المعتمدة"
                value={cards.completedTasks || 0}
                prefix={<CheckCircleOutlined style={{ color: '#2e7d32' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card bordered={false} style={{ borderRight: '4px solid #d32f2f' }}>
              <Statistic
                title="مهام متأخرة"
                value={cards.overdueTasks || 0}
                prefix={<WarningOutlined style={{ color: '#d32f2f' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card
              bordered={false}
              style={{ borderRight: '4px solid #ed6c02', cursor: 'pointer' }}
              onClick={() => navigate('/approvals')}
            >
              <Statistic
                title="خطط بانتظار الاعتماد"
                value={cards.pendingPlans || 0}
                prefix={<CalendarOutlined style={{ color: '#ed6c02' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card
              bordered={false}
              style={{ borderRight: '4px solid #0288d1', cursor: 'pointer' }}
              onClick={() => navigate('/approvals')}
            >
              <Statistic
                title="تقارير بانتظار الاعتماد"
                value={cards.pendingReports || 0}
                prefix={<FileDoneOutlined style={{ color: '#0288d1' }} />}
              />
            </Card>
          </Col>
        </Row>

        {/* إحصائيات الأقسام */}
        <Card title="مؤشرات أداء الأقسام السبعة" bordered={false}>
          <Table
            columns={deptColumns}
            dataSource={departments}
            rowKey="id"
            pagination={false}
            scroll={{ x: 700 }}
          />
        </Card>

        {/* آخر النشاطات */}
        <Card title="آخر نشاطات النظام" bordered={false}>
          <List
            size="small"
            dataSource={activities}
            locale={{ emptyText: 'لا توجد نشاطات مسجلة بعد' }}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.user_name || 'النظام'}</Text>
                      <Tag color="cyan">{item.action}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.created_at ? formatDateTime(item.created_at) : ''}
                      </Text>
                    </Space>
                  }
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </Space>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // لوحة الموظف / مدير القسم
  // ─────────────────────────────────────────────────────────────────────────────
  const cards = statsData?.cards || {};
  const todayTasks = statsData?.todayTasks || [];
  const activePlan = statsData?.activePlan;
  const latestReport = statsData?.latestReport;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#173F45' }}>
            أهلاً بك، {user?.name}
          </Title>
          <Text type="secondary">لوحة مهامك وخططك اليومية</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            style={{ backgroundColor: '#258579' }}
            onClick={() => navigate('/reports')}
          >
            إعداد التقرير اليومي
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/tasks')}>
            مهمة جديدة
          </Button>
        </Space>
      </div>

      {/* بطاقات الإحصاءات للموظف */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRight: '4px solid #258579' }}>
            <Statistic
              title="إجمالي مهامي"
              value={cards.myTasks || 0}
              prefix={<ClockCircleOutlined style={{ color: '#258579' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRight: '4px solid #173F45' }}>
            <Statistic
              title="مهام اليوم"
              value={cards.todayTasks || 0}
              prefix={<CalendarOutlined style={{ color: '#173F45' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRight: '4px solid #2e7d32' }}>
            <Statistic
              title="مهام معتمدة"
              value={cards.completedTasks || 0}
              prefix={<CheckCircleOutlined style={{ color: '#2e7d32' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRight: '4px solid #d32f2f' }}>
            <Statistic
              title="مهام متأخرة"
              value={cards.overdueTasks || 0}
              prefix={<WarningOutlined style={{ color: '#d32f2f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* مهام اليوم */}
        <Col xs={24} lg={14}>
          <Card
            title="مهام اليوم وقيد التنفيذ"
            extra={<Button type="link" onClick={() => navigate('/tasks')}>عرض الكل</Button>}
            bordered={false}
          >
            <List
              dataSource={todayTasks}
              locale={{ emptyText: 'لا توجد مهام مستحقة لليوم! أحسنت العمل.' }}
              renderItem={(task: any) => (
                <List.Item
                  actions={[
                    <Button
                      size="small"
                      type="link"
                      onClick={() => navigate(`/tasks?id=${task.id}`)}
                    >
                      تحديث الإنجاز
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong>{task.title}</Text>}
                    description={
                      <Space>
                        <Tag color={task.priority === 'urgent' ? 'red' : 'blue'}>
                          {task.priority === 'urgent' ? 'عاجل' : 'عادي'}
                        </Tag>
                        <Tag color={task.status === 'approved' ? 'green' : 'orange'}>
                          {task.status}
                        </Tag>
                        <span>نسبة الإنجاز: {task.completion_rate}%</span>
                      </Space>
                    }
                  />
                  <div style={{ width: 120 }}>
                    <Progress percent={task.completion_rate} size="small" strokeColor="#258579" />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* الخطة الحالية والتقرير */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card
              title="خطتي الحالية"
              extra={<Button type="link" onClick={() => navigate('/plans')}>إدارة الخطط</Button>}
              bordered={false}
            >
              {activePlan ? (
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block' }}>{activePlan.title}</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color="cyan">{activePlan.type === 'daily' ? 'يومية' : activePlan.type === 'weekly' ? 'أسبوعية' : 'شهرية'}</Tag>
                    <Tag color={activePlan.status === 'approved' ? 'green' : 'orange'}>{activePlan.status}</Tag>
                  </Space>
                  <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>
                    الفترة: {formatDate(activePlan.period_start, 'readable')} إلى {formatDate(activePlan.period_end, 'readable')}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text type="secondary">لم تقم بإعداد خطة بعد لهذه الفترة.</Text>
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary" size="small" onClick={() => navigate('/plans')}>
                      إنشاء خطة الآن
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            <Card
              title="آخر تقرير"
              extra={<Button type="link" onClick={() => navigate('/reports')}>التقارير</Button>}
              bordered={false}
            >
              {latestReport ? (
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block' }}>{latestReport.title}</Text>
                  <Space style={{ marginTop: 8 }}>
                    <Tag color="purple">{latestReport.type}</Tag>
                    <Tag color={latestReport.status === 'approved' ? 'green' : 'orange'}>{latestReport.status}</Tag>
                  </Space>
                </div>
              ) : (
                <Text type="secondary">لا توجد تقارير سابقة.</Text>
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
};
