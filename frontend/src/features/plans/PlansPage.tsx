// src/features/plans/PlansPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  message,
  Timeline,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export const PlansPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_revision'>('approve');

  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  const isManager = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'department_manager')
    : false;

  // جلب قائمة الخطط
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans-list'],
    queryFn: async () => {
      const res = await apiClient.get('/plans');
      return res.data.data.items;
    },
  });

  // إنشاء خطة جديدة
  const createPlanMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        type: values.type,
        title: values.title,
        period_start: values.period[0].format('YYYY-MM-DD'),
        period_end: values.period[1].format('YYYY-MM-DD'),
        notes: values.notes,
        items: [
          ...(values.goals || []).map((g: string, i: number) => ({
            item_type: 'goal',
            content: g,
            order_index: i,
          })),
          ...(values.activities || []).map((a: string, i: number) => ({
            item_type: 'activity',
            content: a,
            order_index: i,
          })),
        ],
      };
      const res = await apiClient.post('/plans', payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('تم إنشاء الخطة بنجاح');
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['plans-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إنشاء الخطة');
    },
  });

  // إرسال الخطة للمراجعة
  const submitPlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiClient.post(`/plans/${planId}/submit`);
      return res.data;
    },
    onSuccess: () => {
      message.success('تم إرسال الخطة للمراجعة بنجاح');
      setDetailsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['plans-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إرسال الخطة');
    },
  });

  // اعتماد / رفض / طلب تعديل
  const actionMutation = useMutation({
    mutationFn: async ({ planId, action, notes }: any) => {
      const res = await apiClient.post(`/plans/${planId}/action`, { action, notes });
      return res.data;
    },
    onSuccess: () => {
      message.success('تمت معالجة قرار الخطة بنجاح');
      setActionModalOpen(false);
      setDetailsModalOpen(false);
      actionForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['plans-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل تنفيذ الإجراء');
    },
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'draft':
        return <Tag color="default">مسودة</Tag>;
      case 'submitted':
      case 'under_review':
        return <Tag color="processing">قيد المراجعة</Tag>;
      case 'approved':
        return <Tag color="success">معتمدة</Tag>;
      case 'revision_requested':
        return <Tag color="warning">مطلوب تعديل</Tag>;
      case 'rejected':
        return <Tag color="error">مرفوضة</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'العنوان',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <a
          onClick={async () => {
            const res = await apiClient.get(`/plans/${record.id}`);
            setSelectedPlan(res.data.data);
            setDetailsModalOpen(true);
          }}
          style={{ fontWeight: 600, color: '#173F45' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'النوع',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="cyan">
          {type === 'daily' ? 'يومية' : type === 'weekly' ? 'أسبوعية' : 'شهرية'}
        </Tag>
      ),
    },
    {
      title: 'صاحب الخطة',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: 'القسم',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (d: string) => d || '—',
    },
    {
      title: 'الفترة',
      key: 'period',
      render: (_: any, record: any) => (
        <span>
          {record.period_start} إلى {record.period_end}
        </span>
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={async () => {
              const res = await apiClient.get(`/plans/${record.id}`);
              setSelectedPlan(res.data.data);
              setDetailsModalOpen(true);
            }}
          >
            عرض
          </Button>
          {record.user_id === user?.id &&
            (record.status === 'draft' || record.status === 'revision_requested') && (
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                style={{ backgroundColor: '#258579' }}
                onClick={() => submitPlanMutation.mutate(record.id)}
              >
                إرسال للمراجعة
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#173F45' }}>
            إدارة الخطط (اليومية والأسبوعية والشهرية)
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#258579' }}
            onClick={() => setCreateModalOpen(true)}
          >
            خطة جديدة
          </Button>
        </div>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={plansData || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* مودال إنشاء خطة جديدة */}
      <Modal
        title="إنشاء خطة جديدة"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createPlanMutation.mutate(values)}
          initialValues={{ type: 'daily' }}
        >
          <Form.Item name="type" label="نوع الخطة" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="daily">خطة يومية</Select.Option>
              <Select.Option value="weekly">خطة أسبوعية</Select.Option>
              <Select.Option value="monthly">خطة شهرية</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="عنوان الخطة"
            rules={[{ required: true, message: 'يرجى إدخال عنوان الخطة' }]}
          >
            <Input placeholder="مثال: الخطة اليومية - متابعة تقارير الميدان" />
          </Form.Item>

          <Form.Item
            name="period"
            label="فترة الخطة (من - إلى)"
            rules={[{ required: true, message: 'يرجى تحديد الفترة' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label="ملاحظات عامة">
            <Input.TextArea rows={2} placeholder="أي ملاحظات أو اعتبارات خاصة بالخطة" />
          </Form.Item>

          <Divider orientation="right">الأهداف الرئيسية</Divider>
          <Form.List name="goals">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: 'أدخل نص الهدف' }]}
                      style={{ flex: 1, minWidth: 450 }}
                    >
                      <Input placeholder="نص الهدف..." />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      حذف
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  إضافة هدف
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="right">الأنشطة والمهام المقترحة</Divider>
          <Form.List name="activities">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={name}
                      rules={[{ required: true, message: 'أدخل نص النشاط' }]}
                      style={{ flex: 1, minWidth: 450 }}
                    >
                      <Input placeholder="نص النشاط المخطط..." />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>
                      حذف
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  إضافة نشاط
                </Button>
              </>
            )}
          </Form.List>

          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPlanMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                حفظ كمسودة
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* مودال تفاصيل الخطة */}
      <Modal
        title={`تفاصيل الخطة: ${selectedPlan?.title || ''}`}
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        width={700}
        footer={[
          selectedPlan?.user_id === user?.id &&
            (selectedPlan?.status === 'draft' || selectedPlan?.status === 'revision_requested') && (
              <Button
                key="submit"
                type="primary"
                style={{ backgroundColor: '#258579' }}
                onClick={() => submitPlanMutation.mutate(selectedPlan.id)}
              >
                إرسال للمراجعة والاعتماد
              </Button>
            ),
          // زر الاعتماد للمدير أو المدير التنفيذي إذا كانت قيد المراجعة وليست خطته الشخصية
          selectedPlan?.status === 'under_review' &&
            selectedPlan?.user_id !== user?.id &&
            (isExecutive || isManager) && (
              <Space key="approvals">
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setActionType('reject');
                    setActionModalOpen(true);
                  }}
                >
                  رفض
                </Button>
                <Button
                  style={{ color: '#ed6c02', borderColor: '#ed6c02' }}
                  icon={<RollbackOutlined />}
                  onClick={() => {
                    setActionType('request_revision');
                    setActionModalOpen(true);
                  }}
                >
                  إعادة للتعديل
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ backgroundColor: '#2e7d32' }}
                  onClick={() => {
                    setActionType('approve');
                    setActionModalOpen(true);
                  }}
                >
                  اعتماد
                </Button>
              </Space>
            ),
          <Button key="close" onClick={() => setDetailsModalOpen(false)}>
            إغلاق
          </Button>,
        ]}
      >
        {selectedPlan && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Text type="secondary">الحالة:</Text>
                {getStatusTag(selectedPlan.status)}
              </Space>
              <Text type="secondary">
                الفترة: {selectedPlan.period_start} إلى {selectedPlan.period_end}
              </Text>
            </div>

            {selectedPlan.notes && (
              <div>
                <Text strong>ملاحظات:</Text>
                <Paragraph>{selectedPlan.notes}</Paragraph>
              </div>
            )}

            <Divider orientation="right">البنود والأهداف</Divider>
            {selectedPlan.items?.length > 0 ? (
              <Table
                size="small"
                pagination={false}
                dataSource={selectedPlan.items}
                rowKey="id"
                columns={[
                  {
                    title: 'النوع',
                    dataIndex: 'item_type',
                    render: (t: string) => (
                      <Tag color={t === 'goal' ? 'blue' : 'green'}>
                        {t === 'goal' ? 'هدف' : t === 'activity' ? 'نشاط' : 'نتيجة متوقعة'}
                      </Tag>
                    ),
                  },
                  { title: 'المحتوى', dataIndex: 'content' },
                  {
                    title: 'نسبة الإنجاز',
                    dataIndex: 'completion_rate',
                    render: (r: number) => `${r}%`,
                  },
                ]}
              />
            ) : (
              <Text type="secondary">لا توجد بنود مضافة لهذه الخطة.</Text>
            )}

            <Divider orientation="right">سجل دورة الاعتماد</Divider>
            <Timeline
              items={(selectedPlan.approval_steps || []).map((step: any) => ({
                color:
                  step.status === 'approved'
                    ? 'green'
                    : step.status === 'rejected'
                    ? 'red'
                    : step.status === 'revision_requested'
                    ? 'orange'
                    : 'blue',
                children: (
                  <div>
                    <Text strong>
                      {step.approver_name || 'المعتمد'}: {step.status}
                    </Text>
                    {step.notes && <div style={{ color: '#555', fontSize: 13 }}>{step.notes}</div>}
                    {step.acted_at && (
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {new Date(step.acted_at).toLocaleString('ar-YE')}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Space>
        )}
      </Modal>

      {/* مودال اتخاذ قرار الاعتماد / الرفض / الإعادة */}
      <Modal
        title={
          actionType === 'approve'
            ? 'تأكيد اعتماد الخطة'
            : actionType === 'reject'
            ? 'رفض الخطة'
            : 'إعادة الخطة للتعديل'
        }
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        footer={null}
      >
        <Form
          form={actionForm}
          layout="vertical"
          onFinish={(values) =>
            actionMutation.mutate({
              planId: selectedPlan?.id,
              action: actionType,
              notes: values.notes,
            })
          }
        >
          <Form.Item
            name="notes"
            label={actionType === 'approve' ? 'ملاحظات (اختياري)' : 'سبب القرار (إلزامي)'}
            rules={[
              {
                required: actionType !== 'approve',
                message: 'يجب ذكر السبب عند الرفض أو الإعادة للتعديل',
              },
            ]}
          >
            <Input.TextArea rows={3} placeholder="اكتب ملاحظاتك أو سبب القرار بالتفصيل..." />
          </Form.Item>

          <div style={{ textAlign: 'left' }}>
            <Space>
              <Button onClick={() => setActionModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionMutation.isPending}
                style={{
                  backgroundColor:
                    actionType === 'approve'
                      ? '#2e7d32'
                      : actionType === 'reject'
                      ? '#d32f2f'
                      : '#ed6c02',
                }}
              >
                تأكيد الإجراء
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};
