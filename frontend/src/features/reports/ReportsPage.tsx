// src/features/reports/ReportsPage.tsx
import React, { useState, useRef } from 'react';
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
  ThunderboltOutlined,
  PlusOutlined,
  EyeOutlined,
  PrinterOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text, Paragraph } = Typography;

export const ReportsPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_revision'>('approve');

  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const printRef = useRef<HTMLDivElement>(null);

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  const isManager = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'department_manager')
    : false;

  // جلب قائمة التقارير
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports-list'],
    queryFn: async () => {
      const res = await apiClient.get('/reports');
      return res.data.data.items;
    },
  });

  // إنشاء مسودة التقرير اليومي تلقائياً
  const autoGenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/reports/auto-generate', {});
      return res.data.data;
    },
    onSuccess: (report) => {
      message.success('تم إعداد مسودة التقرير اليومي بنجاح من بيانات مهامك!');
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
      setSelectedReport(report);
      setDetailsModalOpen(true);
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إعداد التقرير التلقائي');
    },
  });

  // إنشاء تقرير يدوي
  const createReportMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        type: values.type,
        title: values.title,
        period_start: values.period[0].format('YYYY-MM-DD'),
        period_end: values.period[1].format('YYYY-MM-DD'),
        content: values.content,
      };
      const res = await apiClient.post('/reports', payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('تم إنشاء التقرير بنجاح');
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إنشاء التقرير');
    },
  });

  // إرسال التقرير للمراجعة والاعتماد
  const submitReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const res = await apiClient.post(`/reports/${reportId}/submit`);
      return res.data;
    },
    onSuccess: () => {
      message.success('تم إرسال التقرير للمراجعة والاعتماد بنجاح');
      setDetailsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إرسال التقرير');
    },
  });

  // اتخاذ قرار الاعتماد
  const actionMutation = useMutation({
    mutationFn: async ({ reportId, action, notes }: any) => {
      const res = await apiClient.post(`/reports/${reportId}/action`, { action, notes });
      return res.data;
    },
    onSuccess: () => {
      message.success('تمت معالجة قرار اعتماد التقرير بنجاح');
      setActionModalOpen(false);
      setDetailsModalOpen(false);
      actionForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['reports-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل تنفيذ الإجراء');
    },
  });

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'draft':
        return <Tag color="default">مسودة</Tag>;
      case 'under_review':
        return <Tag color="processing">قيد المراجعة</Tag>;
      case 'approved':
        return <Tag color="success">معتمد</Tag>;
      case 'revision_requested':
        return <Tag color="warning">مطلوب تعديل</Tag>;
      case 'rejected':
        return <Tag color="error">مرفوض</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      title: 'عنوان التقرير',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <a
          onClick={async () => {
            const res = await apiClient.get(`/reports/${record.id}`);
            setSelectedReport(res.data.data);
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
      render: (type: string, record: any) => (
        <Space>
          <Tag color="cyan">
            {type === 'daily' ? 'يومي' : type === 'weekly' ? 'أسبوعي' : 'شهري'}
          </Tag>
          {record.is_auto_generated ? <Tag color="blue">تلقائي</Tag> : null}
        </Space>
      ),
    },
    {
      title: 'الموظف',
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
              const res = await apiClient.get(`/reports/${record.id}`);
              setSelectedReport(res.data.data);
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
                onClick={() => submitReportMutation.mutate(record.id)}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <Title level={4} style={{ margin: 0, color: '#173F45' }}>
            إدارة التقارير الدورية (اليومية والأسبوعية والشهرية)
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              style={{ backgroundColor: '#258579' }}
              loading={autoGenerateMutation.isPending}
              onClick={() => autoGenerateMutation.mutate()}
            >
              إنشاء مسودة التقرير اليومي تلقائياً
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              تقرير يدوي جديد
            </Button>
          </Space>
        </div>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={reportsData || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* مودال إنشاء تقرير يدوي */}
      <Modal
        title="إنشاء تقرير يدوي (أسبوعي / شهري)"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(val) => createReportMutation.mutate(val)}>
          <Form.Item name="type" label="نوع التقرير" rules={[{ required: true }]}>
            <Select placeholder="اختر نوع التقرير">
              <Select.Option value="weekly">تقرير أسبوعي</Select.Option>
              <Select.Option value="monthly">تقرير شهري</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="title" label="عنوان التقرير" rules={[{ required: true }]}>
            <Input placeholder="مثال: التقرير الشهري لقسم الحسابات - نوفمبر 2026" />
          </Form.Item>

          <Form.Item name="period" label="فترة التقرير" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="content" label="محتوى التقرير والأعمال المنجزة">
            <Input.TextArea rows={5} placeholder="اكتب تفاصيل التقرير، الإنجازات، والتحديات..." />
          </Form.Item>

          <div style={{ textAlign: 'left', marginTop: 20 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createReportMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                حفظ كمسودة
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* مودال تفاصيل التقرير وتصديره / اعتماده */}
      <Modal
        title={`تقرير: ${selectedReport?.title || ''}`}
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        width={750}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            طباعة / تصدير PDF
          </Button>,
          selectedReport?.user_id === user?.id &&
            (selectedReport?.status === 'draft' || selectedReport?.status === 'revision_requested') && (
              <Button
                key="submit"
                type="primary"
                style={{ backgroundColor: '#258579' }}
                onClick={() => submitReportMutation.mutate(selectedReport.id)}
              >
                إرسال للمراجعة والاعتماد
              </Button>
            ),
          selectedReport?.status === 'under_review' &&
            selectedReport?.user_id !== user?.id &&
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
        {selectedReport && (
          <div orientation="vertical" style={{ width: '100%' }} ref={printRef}>
            <div
              style={{
                textAlign: 'center',
                paddingBottom: 16,
                borderBottom: '2px solid #258579',
                marginBottom: 16,
              }}
            >
              <Title level={4} style={{ margin: 0, color: '#173F45' }}>
                مؤسسة بصمة للأعمال الإنسانية
              </Title>
              <Text strong>{selectedReport.title}</Text>
              <div style={{ marginTop: 4, color: '#666', fontSize: 12 }}>
                الموظف: {selectedReport.user_name} | القسم: {selectedReport.department_name || '—'} |
                الفترة: {selectedReport.period_start} إلى {selectedReport.period_end}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space>
                <Text type="secondary">الحالة:</Text>
                {getStatusTag(selectedReport.status)}
              </Space>
              {selectedReport.is_auto_generated ? (
                <Tag color="blue">مُنشأ تلقائياً من نظام المهام</Tag>
              ) : null}
            </div>

            <Divider orientation="right">محتوى التقرير والأعمال</Divider>
            <div
              style={{
                whiteSpace: 'pre-line',
                background: '#fafafa',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #f0f0f0',
                lineHeight: 1.8,
              }}
            >
              {selectedReport.content}
            </div>

            {selectedReport.tasks?.length > 0 && (
              <>
                <Divider orientation="right">المهام المرتبطة بالتقرير</Divider>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={selectedReport.tasks}
                  rowKey="id"
                  columns={[
                    { title: 'المهمة', dataIndex: 'title' },
                    {
                      title: 'نسبة الإنجاز',
                      dataIndex: 'completion_rate',
                      render: (r: number) => `${r}%`,
                    },
                    { title: 'الحالة', dataIndex: 'status' },
                  ]}
                />
              </>
            )}

            <Divider orientation="right">سجل دورة الاعتماد</Divider>
            <Timeline
              items={(selectedReport.approval_steps || []).map((step: any) => ({
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
          </div>
        )}
      </Modal>

      {/* مودال اتخاذ قرار الاعتماد / الرفض */}
      <Modal
        title={
          actionType === 'approve'
            ? 'تأكيد اعتماد التقرير'
            : actionType === 'reject'
            ? 'رفض التقرير'
            : 'إعادة التقرير للتعديل'
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
              reportId: selectedReport?.id,
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
