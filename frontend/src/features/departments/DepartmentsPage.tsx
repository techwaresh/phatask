// src/features/departments/DepartmentsPage.tsx
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
  Select,
  Typography,
  message,
} from 'antd';
import { UserSwitchOutlined } from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text } = Typography;

export const DepartmentsPage: React.FC = () => {
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  // جلب الأقسام
  const { data: deptsData, isLoading } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await apiClient.get('/departments');
      return res.data.data;
    },
  });

  // جلب المستخدمين لاختيار مدير قسم
  const { data: usersData } = useQuery({
    queryKey: ['users-for-manager'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data;
    },
    enabled: isExecutive,
  });

  // تعيين مدير قسم
  const setManagerMutation = useMutation({
    mutationFn: async ({ deptId, managerId }: any) => {
      const res = await apiClient.put(`/departments/${deptId}/manager`, { managerId });
      return res.data;
    },
    onSuccess: () => {
      message.success('تم تحديث مدير القسم بنجاح');
      setManagerModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل تعيين مدير القسم');
    },
  });

  const columns = [
    {
      title: 'اسم القسم',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'مدير القسم الحالي',
      dataIndex: 'manager_name',
      key: 'manager_name',
      render: (name: string) =>
        name ? (
          <Tag color="cyan">{name}</Tag>
        ) : (
          <Tag color="orange">بدون مدير معين (إشراف تنفيذي مباشر)</Tag>
        ),
    },
    {
      title: 'عدد الموظفين',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (c: number) => <Tag color="blue">{c} موظف</Tag>,
    },
    {
      title: 'الوصف',
      dataIndex: 'description',
      key: 'description',
      render: (d: string) => d || '—',
    },
    ...(isExecutive
      ? [
          {
            title: 'الإجراءات',
            key: 'actions',
            render: (_: any, record: any) => (
              <Button
                size="small"
                icon={<UserSwitchOutlined />}
                onClick={() => {
                  setSelectedDept(record);
                  form.setFieldsValue({ managerId: record.manager_id || undefined });
                  setManagerModalOpen(true);
                }}
              >
                تغيير مدير القسم
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, color: '#173F45' }}>
          هيكل الأقسام المؤسسية
        </Title>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={deptsData || []}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />

      {/* مودال تعيين / تغيير مدير القسم */}
      <Modal
        title={`تعيين مدير قسم: ${selectedDept?.name || ''}`}
        open={managerModalOpen}
        onCancel={() => setManagerModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            setManagerMutation.mutate({
              deptId: selectedDept.id,
              managerId: values.managerId || null,
            })
          }
        >
          <Form.Item
            name="managerId"
            label="اختر مدير القسم"
            help="الأقسام التي تترك بدون مدير معين يتم إشراف واعتماد خططها مباشرة من المدير التنفيذي."
          >
            <Select placeholder="اختر الموظف أو اتركه فارغاً" allowClear>
              {(usersData || []).map((u: any) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'left', marginTop: 20 }}>
            <Space>
              <Button onClick={() => setManagerModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={setManagerMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                حفظ التغيير
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};
