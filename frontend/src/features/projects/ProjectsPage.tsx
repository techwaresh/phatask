// src/features/projects/ProjectsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Steps,
  Progress,
  Typography,
  message,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  List,
} from 'antd';
import {
  ProjectOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  PaperClipOutlined,
  ArrowLeftOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/date';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const STAGES_LIST = [
  { key: 'intake', title: 'وصول المشروع', desc: 'الاعتماد الأولي' },
  { key: 'financial_analysis', title: 'التحليل المالي', desc: 'صافي الموازنة ونسب 10%' },
  { key: 'procurement', title: 'اللوجستيات والتوريد', desc: 'عروض الأسعار وأمر الشراء' },
  { key: 'field_execution', title: 'التنفيذ الميداني', desc: 'التصاريح وكشوف المستفيدين' },
  { key: 'media_production', title: 'التوثيق والإعلام', desc: 'الصور وفيديو المونتاج' },
  { key: 'evaluation', title: 'التقييم M&E', desc: 'الإيجابيات والتقرير الفني' },
  { key: 'donor_handover', title: 'حزمة الداعم', desc: 'التسليم والإغلاق' },
  { key: 'completed', title: 'مكتمل', desc: 'مؤرشف' },
];

export const ProjectsPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);

  const [form] = Form.useForm();
  const [taskForm] = Form.useForm();
  const [stageForm] = Form.useForm();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  const isManager = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'department_manager')
    : false;

  // جلب قائمة المشاريع
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const res = await apiClient.get('/projects');
      return res.data.data.items;
    },
  });

  // جلب تفاصيل المشروع المحدد
  const { data: projectDetails, isLoading: loadingDetails, refetch: refetchDetails } = useQuery({
    queryKey: ['project-details', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const res = await apiClient.get(`/projects/${selectedProjectId}`);
      return res.data.data;
    },
    enabled: !!selectedProjectId,
  });

  // جلب المستخدمين لإسناد المهام
  const { data: usersData } = useQuery({
    queryKey: ['users-for-project-tasks'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data;
    },
    enabled: isExecutive || isManager,
  });

  // إنشاء مشروع جديد
  const createProjectMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        donor: values.donor,
        description: values.description,
        location: values.location,
        start_date: values.dates[0].format('YYYY-MM-DD'),
        end_date: values.dates[1].format('YYYY-MM-DD'),
        total_budget: values.total_budget,
        currency: values.currency || 'USD',
      };
      const res = await apiClient.post('/projects', payload);
      return res.data;
    },
    onSuccess: (data) => {
      message.success('تم إنشاء المشروع بنجاح وإسناد أولى مهام الموازنة لقسم الحسابات');
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
      if (data?.data?.id) {
        setSelectedProjectId(data.data.id);
        setDrawerOpen(true);
      }
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إنشاء المشروع');
    },
  });

  // حفظ بيانات مرحلة
  const saveStageMutation = useMutation({
    mutationFn: async ({ stage, data }: { stage: string; data: any }) => {
      if (!selectedProjectId) return;
      await apiClient.put(`/projects/${selectedProjectId}/stage`, { stage, data });
    },
    onSuccess: () => {
      message.success('تم حفظ بيانات المرحلة بنجاح');
      refetchDetails();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل حفظ بيانات المرحلة');
    },
  });

  // الانتقال للمرحلة التالية
  const advanceStageMutation = useMutation({
    mutationFn: async (nextStage: string) => {
      if (!selectedProjectId) return;
      await apiClient.post(`/projects/${selectedProjectId}/advance`, { nextStage });
    },
    onSuccess: () => {
      message.success('تم الانتقال للمرحلة التالية وتوليد مهام العمل بنجاح');
      refetchDetails();
      queryClient.invalidateQueries({ queryKey: ['projects-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل الانتقال للمرحلة التالية');
    },
  });

  // إنشاء مهمة جديدة مرتبطة بالمشروع
  const createTaskMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedProjectId) return;
      await apiClient.post(`/projects/${selectedProjectId}/tasks`, {
        title: values.title,
        description: values.description,
        assigned_to: values.assigned_to,
        priority: values.priority,
        due_date: values.due_date.format('YYYY-MM-DD'),
      });
    },
    onSuccess: () => {
      message.success('تمت إضافة المهمة إلى المشروع بنجاح');
      setAddTaskModalOpen(false);
      taskForm.resetFields();
      refetchDetails();
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إنشاء المهمة');
    },
  });

  const getStageIndex = (stageKey: string) => {
    const idx = STAGES_LIST.findIndex((s) => s.key === stageKey);
    return idx >= 0 ? idx : 0;
  };

  const getStageTag = (stageKey: string) => {
    switch (stageKey) {
      case 'intake':
        return <Tag color="blue">وصول المشروع</Tag>;
      case 'financial_analysis':
        return <Tag color="orange">التحليل المالي</Tag>;
      case 'procurement':
        return <Tag color="cyan">اللوجستيات والتوريد</Tag>;
      case 'field_execution':
        return <Tag color="purple">التنفيذ الميداني</Tag>;
      case 'media_production':
        return <Tag color="magenta">التوثيق والإعلام</Tag>;
      case 'evaluation':
        return <Tag color="gold">المتابعة والتقييم</Tag>;
      case 'donor_handover':
        return <Tag color="green">حزمة الداعم</Tag>;
      case 'completed':
        return <Tag color="success">مكتمل ومؤرشف</Tag>;
      default:
        return <Tag>{stageKey}</Tag>;
    }
  };

  // إحصائيات سريعة
  const totalProjects = (projectsData || []).length;
  const activeProjects = (projectsData || []).filter((p: any) => p.status === 'active').length;
  const completedProjects = (projectsData || []).filter((p: any) => p.current_stage === 'completed').length;
  const totalBudgetUSD = (projectsData || []).reduce((sum: number, p: any) => sum + Number(p.total_budget || 0), 0);

  const columns = [
    {
      title: 'كود المشروع',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string, record: any) => (
        <a
          onClick={() => {
            setSelectedProjectId(record.id);
            setDrawerOpen(true);
          }}
          style={{ fontWeight: 600, color: '#173F45' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'اسم المشروع',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <a
            onClick={() => {
              setSelectedProjectId(record.id);
              setDrawerOpen(true);
            }}
            style={{ fontWeight: 600, color: '#258579' }}
          >
            {name}
          </a>
          <div style={{ fontSize: 11, color: '#888' }}>{record.location}</div>
        </div>
      ),
    },
    {
      title: 'الجهة الداعمة',
      dataIndex: 'donor',
      key: 'donor',
    },
    {
      title: 'الميزانية المعتمدة',
      dataIndex: 'total_budget',
      key: 'total_budget',
      render: (b: number, r: any) => (
        <span style={{ fontWeight: 600, color: '#173F45' }}>
          {Number(b).toLocaleString()} {r.currency}
        </span>
      ),
    },
    {
      title: 'المرحلة الحالية',
      dataIndex: 'current_stage',
      key: 'current_stage',
      render: (s: string) => getStageTag(s),
    },
    {
      title: 'فترة التنفيذ',
      key: 'period',
      render: (_: any, r: any) => (
        <span style={{ fontSize: 12 }}>
          {formatDate(r.start_date, 'readable')} ➔ {formatDate(r.end_date, 'readable')}
        </span>
      ),
    },
    {
      title: 'إنجاز المهام',
      key: 'tasks_progress',
      width: 140,
      render: (_: any, r: any) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Progress percent={r.tasks_progress || 0} size="small" strokeColor="#258579" />
          <span style={{ fontSize: 11, color: '#888' }}>
            {r.completed_tasks || 0} من {r.total_tasks || 0} مهمة
          </span>
        </Space>
      ),
    },
    {
      title: 'الإجراء',
      key: 'action',
      render: (_: any, r: any) => (
        <Button
          size="small"
          onClick={() => {
            setSelectedProjectId(r.id);
            setDrawerOpen(true);
          }}
        >
          متابعة
        </Button>
      ),
    },
  ];

  const currentStageKey = projectDetails?.current_stage || 'intake';
  const currentStageIdx = getStageIndex(currentStageKey);
  const nextStageObj = currentStageIdx < STAGES_LIST.length - 1 ? STAGES_LIST[currentStageIdx + 1] : null;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* بطاقات الإحصائيات السريعة */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="إجمالي المشاريع"
              value={totalProjects}
              prefix={<ProjectOutlined style={{ color: '#258579' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="المشاريع النشطة قيد التنفيذ"
              value={activeProjects}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="المشاريع المكتملة"
              value={completedProjects}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="إجمالي اعتمادات المشاريع"
              value={totalBudgetUSD}
              prefix={<DollarOutlined style={{ color: '#173F45' }} />}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      {/* جدول المشاريع الرئيسي */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0, color: '#173F45' }}>
              إدارة ومتابعة المشاريع المؤسسية
            </Title>
            {(isExecutive || isManager) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{ backgroundColor: '#258579' }}
                onClick={() => setCreateModalOpen(true)}
              >
                مشروع جديد
              </Button>
            )}
          </div>
        }
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={projectsData || []}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* نافذة تفاصيل المشروع الشاملة (Project Workspace) */}
      <Drawer
        title={
          projectDetails ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#173F45' }}>
                  {projectDetails.code} - {projectDetails.name}
                </span>
                <span style={{ marginRight: 8 }}>{getStageTag(projectDetails.current_stage)}</span>
              </div>
            </div>
          ) : (
            'تفاصيل المشروع'
          )
        }
        width={850}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {projectDetails && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* شريط معلومات أساسية */}
            <Card size="small" style={{ backgroundColor: '#F4F6F7', borderRadius: 6 }}>
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>الجهة الداعمة</Text>
                  <Text strong>{projectDetails.donor}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>موقع التنفيذ</Text>
                  <Text strong>{projectDetails.location}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>مبلغ الاعتماد</Text>
                  <Text strong style={{ color: '#258579' }}>
                    {Number(projectDetails.total_budget).toLocaleString()} {projectDetails.currency}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>فترة المشروع</Text>
                  <Text strong style={{ fontSize: 12 }}>
                    {formatDate(projectDetails.start_date, 'readable')} ➔ {formatDate(projectDetails.end_date, 'readable')}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* مسار مراحل المشروع (Steps) */}
            <div style={{ padding: '16px 8px', overflowX: 'auto' }}>
              <Steps
                current={currentStageIdx}
                items={STAGES_LIST.map((s) => ({
                  title: s.title,
                  description: s.desc,
                }))}
              />
            </div>

            {/* زر الانتقال التفاعلي للمرحلة التالية */}
            {nextStageObj && (
              <Alert
                type="info"
                showIcon
                message={`المرحلة التالية المجدولة: ${nextStageObj.title} (${nextStageObj.desc})`}
                description="عند الانتقال للمرحلة التالية، سيتم آلياً توليد المهام الميدانية أو المالية المقابلة وإسنادها للقسم المختص."
                action={
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#258579' }}
                    loading={advanceStageMutation.isPending}
                    onClick={() => advanceStageMutation.mutate(nextStageObj.key)}
                  >
                    الانتقال لمرحلة: {nextStageObj.title}
                  </Button>
                }
              />
            )}

            {/* تبويبات متابعة وتسهيل العمل للمشروع */}
            <Tabs
              defaultActiveKey="tasks"
              items={[
                {
                  key: 'tasks',
                  label: (
                    <span>
                      <CheckSquareOutlined /> المهام المرتبطة ({projectDetails.tasks?.length || 0})
                    </span>
                  ),
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text strong style={{ color: '#173F45' }}>
                          المهام التنفيذية الموزعة على الأقسام والموظفين
                        </Text>
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          style={{ backgroundColor: '#258579' }}
                          onClick={() => setAddTaskModalOpen(true)}
                        >
                          إضافة مهمة جديدة للمشروع
                        </Button>
                      </div>

                      <Table
                        size="small"
                        dataSource={projectDetails.tasks || []}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          {
                            title: 'عنوان المهمة',
                            dataIndex: 'title',
                            key: 'title',
                            render: (text: string) => <Text strong>{text}</Text>,
                          },
                          {
                            title: 'المكلف بها',
                            dataIndex: 'assigned_to_name',
                            key: 'assigned_to_name',
                          },
                          {
                            title: 'تاريخ التسليم',
                            dataIndex: 'due_date',
                            key: 'due_date',
                            render: (d: string) => formatDate(d, 'readable'),
                          },
                          {
                            title: 'نسبة الإنجاز',
                            dataIndex: 'completion_rate',
                            key: 'completion_rate',
                            render: (rate: number) => (
                              <Progress percent={rate} size="small" strokeColor="#258579" />
                            ),
                          },
                          {
                            title: 'الحالة',
                            dataIndex: 'status',
                            key: 'status',
                            render: (st: string) => {
                              if (st === 'approved' || st === 'completed') return <Tag color="success">مكتملة</Tag>;
                              if (st === 'in_progress') return <Tag color="processing">قيد التنفيذ</Tag>;
                              return <Tag color="default">معلقة</Tag>;
                            },
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: 'financial',
                  label: '💰 التحليل المالي والموازنة',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Paragraph type="secondary">
                        يقوم قسم الحسابات باحتساب صافي مبلغ المشروع ونسب التشغيل 10% والمصاريف الإدارية 10% وأجور النقل.
                      </Paragraph>
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.financial_analysis?.data || {
                          operational_rate: 10,
                          admin_rate: 10,
                          total_budget: projectDetails.total_budget,
                        }}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'financial_analysis', data: values })
                        }
                      >
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item label="المبلغ الإجمالي المعتمد" name="total_budget">
                              <InputNumber style={{ width: '100%' }} disabled />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item label="نسبة المصاريف التشغيلية (%)" name="operational_rate">
                              <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item label="نسبة المصاريف الإدارية (%)" name="admin_rate">
                              <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="أجور النقل والترتيبات اللوجستية" name="transport_fees">
                              <Input placeholder="مثال: 500 USD أجور شحن ونقل" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="صافي مبلغ تنفيذ المشروع المخصص للمستفيدين" name="net_budget">
                              <InputNumber style={{ width: '100%' }} placeholder="صافي المبلغ" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="ملاحظات المحاسب وتفاصيل الصرف" name="notes">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ التحليل المالي
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'procurement',
                  label: '📦 اللوجستيات وعروض الأسعار',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Paragraph type="secondary">
                        يقوم قسم اللوجستيات بجمع عروض الأسعار من الموردين وتحرير أمر الشراء ومحضر توريد الأصناف.
                      </Paragraph>
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.procurement?.data || {}}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'procurement', data: values })
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="اسم التاجر / المورد المعتمد" name="vendor_name">
                              <Input placeholder="اسم التاجر الذي تم اختياره" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="رقم أمر الشراء (PO)" name="po_number">
                              <Input placeholder="مثال: PO-2026-088" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="تاريخ محضر توريد الأصناف" name="delivery_date">
                              <Input placeholder="تاريخ التوريد إلى الموقع" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="حالة استلام الأصناف ومطابقتها" name="delivery_status">
                              <Select placeholder="اختر الحالة">
                                <Select.Option value="received_matched">تم التوريد ومطابق للمواصفات</Select.Option>
                                <Select.Option value="pending_arrival">قيد الشحن والتوصيل للموقع</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="تفاصيل الأصناف والسلات وملاحظات اللوجستيات" name="notes">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ بيانات اللوجستيات والتوريد
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'field',
                  label: '📍 التجهيز الميداني والمستفيدين',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.field_execution?.data || {}}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'field_execution', data: values })
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="التصاريح والموافقات الأمنية والمحلية" name="permits_status">
                              <Select placeholder="حالة التصاريح">
                                <Select.Option value="obtained">تم استخراج كافة التصاريح الرسمية</Select.Option>
                                <Select.Option value="in_progress">قيد المتابعة مع الجهات المختصة</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="التنسيق المجتمعي (المدارس / المراكز)" name="community_partner">
                              <Input placeholder="اللجان المجتمعية، المدرسة المحددة للتوزيع..." />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="عدد الأسر / المستفيدين المستهدفين" name="target_beneficiaries">
                              <InputNumber style={{ width: '100%' }} placeholder="مثال: 500 أسرة" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="خطة الأمن والسلامة الميدانية" name="safety_plan">
                              <Input placeholder="مسؤولي الأمن، ترتيب الطوابير، معايير الحماية" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ بيانات التجهيز الميداني
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'media',
                  label: '📸 التوثيق الإعلامي والمونتاج',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.media_production?.data || {}}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'media_production', data: values })
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="رابط ألبوم الصور المعتمدة (Drive / Cloud)" name="photo_album_url">
                              <Input placeholder="https://..." />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="رابط فيديو المونتاج النهائي" name="video_url">
                              <Input placeholder="https://..." />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="حالة المونتاج والتجهيز" name="montage_status">
                              <Select placeholder="حالة المونتاج">
                                <Select.Option value="completed">تم المونتاج وجاهز للتسليم</Select.Option>
                                <Select.Option value="editing">قيد الفرز والمونتاج</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="أعضاء الفريق الإعلامي الميداني" name="media_team">
                              <Input placeholder="أسماء المصورين والموثقين" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ بيانات الإعلام والتوثيق
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'evaluation',
                  label: '📊 المتابعة والتقييم (M&E)',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.evaluation?.data || {}}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'evaluation', data: values })
                        }
                      >
                        <Form.Item label="النقاط الإيجابية وقصص النجاح" name="strengths">
                          <Input.TextArea rows={2} placeholder="أبرز الإيجابيات وسرعة التنفيذ..." />
                        </Form.Item>
                        <Form.Item label="السلبيات والتحديات التي واجهت التنفيذ" name="weaknesses">
                          <Input.TextArea rows={2} placeholder="الصعوبات الميدانية والتوصيات المقترحة..." />
                        </Form.Item>
                        <Form.Item label="ملخص التقرير الفني الشامل" name="technical_report">
                          <Input.TextArea rows={3} placeholder="ملخص مخرجات التقرير الفني المرفوع للداعم..." />
                        </Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ التقييم الفني
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
                {
                  key: 'donor_package',
                  label: '📁 حزمة الجهة الداعمة',
                  children: (
                    <Card size="small" style={{ borderRadius: 6 }}>
                      <Alert
                        type="success"
                        showIcon
                        message="قائمة المستندات الخمسة المعتمدة لتسليمها للجهة الداعمة:"
                        description={
                          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.8 }}>
                            <div>1. 📋 كشوفات المستفيدين الرسمية الموقعة والمختومة.</div>
                            <div>2. 📑 التقرير الفني الشامل للمشروع.</div>
                            <div>3. 🧾 فواتير الشراء الرسمية ومحاضر التوريد الموقعة.</div>
                            <div>4. 💵 سند القبض والإشعارات المالية والمصرفية.</div>
                            <div>5. 🎬 التوثيق الإعلامي الكامل (ألبوم الصور + فيديو المونتاج).</div>
                          </div>
                        }
                      />
                      <Divider />
                      <Form
                        layout="vertical"
                        initialValues={projectDetails.stages_data?.donor_package?.data || {}}
                        onFinish={(values) =>
                          saveStageMutation.mutate({ stage: 'donor_package', data: values })
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item label="تاريخ التسليم للجهة الداعمة" name="handover_date">
                              <Input placeholder="YYYY-MM-DD" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="اسم المستلم لدى الجهة الداعمة" name="recipient_name">
                              <Input placeholder="ممثل المنظمة أو المانح" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item label="ملاحظات الاعتماد والتسليم النهائي" name="final_notes">
                          <Input.TextArea rows={2} />
                        </Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          style={{ backgroundColor: '#258579' }}
                          loading={saveStageMutation.isPending}
                        >
                          حفظ واعتماد حزمة الداعم
                        </Button>
                      </Form>
                    </Card>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Drawer>

      {/* مودال إنشاء مشروع جديد */}
      <Modal
        title="إنشاء مشروع جديد في النظام"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        destroyOnClose
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createProjectMutation.mutate(values)}
          initialValues={{ currency: 'USD' }}
        >
          <Form.Item
            name="name"
            label="اسم المشروع"
            rules={[{ required: true, message: 'اسم المشروع مطلوب' }]}
          >
            <Input placeholder="مثال: مشروع توزيع السلات الغذائية للأسر الأشد فقراً" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="donor"
                label="الجهة الداعمة / المانح"
                rules={[{ required: true, message: 'الجهة الداعمة مطلوبة' }]}
              >
                <Input placeholder="مثال: منظمة الأغذية العالمية أو فاعل خير" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="مكان التنفيذ"
                rules={[{ required: true, message: 'مكان التنفيذ مطلوب' }]}
              >
                <Input placeholder="المحافظة - المديرية - الموقع" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="total_budget"
                label="مبلغ الاعتماد الإجمالي"
                rules={[{ required: true, message: 'مبلغ الاعتماد مطلوب' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="الميزانية الإجمالية" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="currency" label="العملة" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="USD">دولار أمريكي (USD)</Select.Option>
                  <Select.Option value="YER">ريال يمني (YER)</Select.Option>
                  <Select.Option value="SAR">ريال سعودي (SAR)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dates"
            label="فترة التنفيذ المخططة (تاريخ البداية إلى النهاية)"
            rules={[{ required: true, message: 'فترة التنفيذ مطلوبة' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label="صياغة وتفاصيل ومخرجات المشروع">
            <Input.TextArea rows={3} placeholder="اكتب نبذة عن المشروع، الفئات المستهدفة، والمخرجات المرجوة..." />
          </Form.Item>

          <div style={{ textAlign: 'left', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createProjectMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                إنشاء المشروع وبدء العمل
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* مودال إضافة مهمة جديدة مخصصة للمشروع */}
      <Modal
        title="إضافة مهمة تنفيذية للمشروع"
        open={addTaskModalOpen}
        onCancel={() => setAddTaskModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={(values) => createTaskMutation.mutate(values)}
          initialValues={{ priority: 'medium' }}
        >
          <Form.Item
            name="title"
            label="عنوان المهمة"
            rules={[{ required: true, message: 'عنوان المهمة مطلوب' }]}
          >
            <Input placeholder="مثال: مطابقة كشوف المستفيدين في مدرسة النصر" />
          </Form.Item>

          <Form.Item name="description" label="تفاصيل المهمة">
            <Input.TextArea rows={2} placeholder="المخرجات المطلوبة..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assigned_to"
                label="إسناد المهمة إلى"
                rules={[{ required: true, message: 'اختر المكلف' }]}
              >
                <Select placeholder="اختر الموظف المكلف">
                  {(usersData || []).map((u: any) => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.name} ({u.department_name || 'موظف'})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="الأولوية" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="low">منخفضة</Select.Option>
                  <Select.Option value="medium">متوسطة</Select.Option>
                  <Select.Option value="high">مرتفعة</Select.Option>
                  <Select.Option value="urgent">عاجل جداً</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="due_date"
            label="موعد التسليم"
            rules={[{ required: true, message: 'تاريخ التسليم مطلوب' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'left', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setAddTaskModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTaskMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                إضافة المهمة
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Space>
  );
};
