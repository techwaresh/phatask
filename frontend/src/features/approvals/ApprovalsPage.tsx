// src/features/approvals/ApprovalsPage.tsx
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
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/date';

const { Title, Text } = Typography;

export const ApprovalsPage: React.FC = () => {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_revision'>('approve');

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // جلب بنود الاعتماد المعلقة
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const res = await apiClient.get('/approvals/pending');
      return res.data.data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ step, action, notes }: any) => {
      const endpoint =
        step.entity_type === 'plan'
          ? `/plans/${step.entity_id}/action`
          : `/reports/${step.entity_id}/action`;

      const res = await apiClient.post(endpoint, { action, notes });
      return res.data;
    },
    onSuccess: () => {
      message.success('تمت معالجة قرار الاعتماد بنجاح');
      setActionModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل تنفيذ الإجراء');
    },
  });

  const columns = [
    {
      title: 'النوع',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (t: string) => (
        <Tag color={t === 'plan' ? 'cyan' : 'purple'}>
          {t === 'plan' ? 'خطة عمل' : 'تقرير دوري'}
        </Tag>
      ),
    },
    {
      title: 'العنوان',
      key: 'title',
      render: (_: any, record: any) => (
        <Text strong>{record.entity_details?.title || `#${record.entity_id}`}</Text>
      ),
    },
    {
      title: 'الموظف',
      key: 'creator',
      render: (_: any, record: any) => (
        <span>{record.entity_details?.creator_name || '—'}</span>
      ),
    },
    {
      title: 'القسم',
      key: 'dept',
      render: (_: any, record: any) => (
        <Tag>{record.entity_details?.department_name || '—'}</Tag>
      ),
    },
    {
      title: 'تاريخ الإرسال',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => formatDateTime(d),
    },
    {
      title: 'القرار والإجراء',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              if (record.entity_type === 'plan') navigate('/plans');
              else navigate('/reports');
            }}
          >
            معاينة
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{ backgroundColor: '#2e7d32' }}
            onClick={() => {
              setSelectedStep(record);
              setActionType('approve');
              setActionModalOpen(true);
            }}
          >
            اعتماد
          </Button>
          <Button
            size="small"
            icon={<RollbackOutlined />}
            style={{ color: '#ed6c02', borderColor: '#ed6c02' }}
            onClick={() => {
              setSelectedStep(record);
              setActionType('request_revision');
              setActionModalOpen(true);
            }}
          >
            إعادة
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setSelectedStep(record);
              setActionType('reject');
              setActionModalOpen(true);
            }}
          >
            رفض
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: '#173F45' }}>
          مركز الاعتمادات والمراجعات الإدارية
        </Title>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={pendingData || []}
        rowKey="id"
        loading={isLoading}
        locale={{ emptyText: 'رائع! لا توجد خطط أو تقارير معلقة بانتظار اعتمادك.' }}
      />

      <Modal
        title={
          actionType === 'approve'
            ? 'تأكيد الاعتماد'
            : actionType === 'reject'
            ? 'رفض الطلب'
            : 'طلب تعديل وإعادة للموظف'
        }
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            actionMutation.mutate({
              step: selectedStep,
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
                message: 'يجب كتابة سبب القرار وملاحظات التعديل بالتفصيل',
              },
            ]}
          >
            <Input.TextArea rows={4} placeholder="اكتب ملاحظاتك..." />
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
                تأكيد
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};
