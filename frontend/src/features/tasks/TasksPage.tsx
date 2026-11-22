// src/features/tasks/TasksPage.tsx
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
  Select,
  DatePicker,
  Slider,
  Progress,
  Typography,
  message,
  List,
  Avatar,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const { Title, Text, Paragraph } = Typography;

export const TasksPage: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [commentText, setCommentText] = useState('');

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isExecutive = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'executive_director')
    : false;

  const isManager = Array.isArray(user?.roles)
    ? user.roles.some((r: any) => (typeof r === 'string' ? r : r.name) === 'department_manager')
    : false;

  // جلب المهام
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const res = await apiClient.get('/tasks');
      return res.data.data.items;
    },
  });

  // جلب المستخدمين للإسناد
  const { data: usersData } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.data;
    },
    enabled: isExecutive || isManager,
  });

  // إنشاء مهمة
  const createTaskMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        title: values.title,
        description: values.description,
        assigned_to: values.assigned_to || user?.id,
        priority: values.priority || 'medium',
        due_date: values.due_date.format('YYYY-MM-DD'),
      };
      const res = await apiClient.post('/tasks', payload);
      return res.data;
    },
    onSuccess: () => {
      message.success('تم إنشاء المهمة بنجاح');
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.error?.message || 'فشل إنشاء المهمة');
    },
  });

  // تحديث نسبة الإنجاز
  const updateProgressMutation = useMutation({
    mutationFn: async ({ taskId, rate }: { taskId: number; rate: number }) => {
      const res = await apiClient.put(`/tasks/${taskId}/progress`, {
        completion_rate: rate,
      });
      return res.data.data;
    },
    onSuccess: (updatedTask) => {
      message.success('تم تحديث نسبة الإنجاز');
      setSelectedTask(updatedTask);
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
  });

  // اعتماد المهمة
  const approveTaskMutation = useMutation({
    mutationFn: async ({ taskId, action, notes }: any) => {
      const res = await apiClient.post(`/tasks/${taskId}/approve`, { action, notes });
      return res.data.data;
    },
    onSuccess: (updatedTask) => {
      message.success('تم تحديث حالة اعتماد المهمة');
      setSelectedTask(updatedTask);
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    },
  });

  // إضافة تعليق
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: number; content: string }) => {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      return res.data.data;
    },
    onSuccess: () => {
      setCommentText('');
      // تحديث تفاصيل المهمة
      if (selectedTask) {
        apiClient.get(`/tasks/${selectedTask.id}`).then((res) => {
          setSelectedTask(res.data.data);
        });
      }
    },
  });

  const getPriorityTag = (p: string) => {
    switch (p) {
      case 'urgent':
        return <Tag color="error">عاجل جداً</Tag>;
      case 'high':
        return <Tag color="warning">مرتفعة</Tag>;
      case 'medium':
        return <Tag color="processing">متوسطة</Tag>;
      default:
        return <Tag color="default">منخفضة</Tag>;
    }
  };

  const getStatusTag = (s: string) => {
    switch (s) {
      case 'pending':
        return <Tag color="default">معلقة</Tag>;
      case 'in_progress':
        return <Tag color="processing">قيد التنفيذ</Tag>;
      case 'under_review':
        return <Tag color="warning">قيد المراجعة</Tag>;
      case 'approved':
        return <Tag color="success">معتمدة ومكتملة</Tag>;
      case 'rejected':
        return <Tag color="error">مرفوضة</Tag>;
      default:
        return <Tag>{s}</Tag>;
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
            const res = await apiClient.get(`/tasks/${record.id}`);
            setSelectedTask(res.data.data);
            setProgressVal(res.data.data.completion_rate);
            setDrawerOpen(true);
          }}
          style={{ fontWeight: 600, color: '#173F45' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'الأولوية',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => getPriorityTag(p),
    },
    {
      title: 'المكلف بها',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      render: (name: string) => name || '—',
    },
    {
      title: 'القسم',
      dataIndex: 'department_name',
      key: 'department_name',
      render: (d: string) => d || '—',
    },
    {
      title: 'موعد التسليم',
      dataIndex: 'due_date',
      key: 'due_date',
    },
    {
      title: 'نسبة الإنجاز',
      dataIndex: 'completion_rate',
      key: 'completion_rate',
      render: (rate: number) => (
        <Progress percent={rate} size="small" strokeColor="#258579" style={{ width: 100 }} />
      ),
    },
    {
      title: 'الحالة',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => getStatusTag(s),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#173F45' }}>
            إدارة ومتابعة المهام
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ backgroundColor: '#258579' }}
            onClick={() => setCreateModalOpen(true)}
          >
            مهمة جديدة
          </Button>
        </div>
      }
      bordered={false}
    >
      <Table
        columns={columns}
        dataSource={tasksData || []}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* مودال إنشاء مهمة جديدة */}
      <Modal
        title="إنشاء مهمة جديدة"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createTaskMutation.mutate(values)}
          initialValues={{ priority: 'medium' }}
        >
          <Form.Item
            name="title"
            label="عنوان المهمة"
            rules={[{ required: true, message: 'عنوان المهمة مطلوب' }]}
          >
            <Input placeholder="مثال: إعداد الكشف المالي الشهري" />
          </Form.Item>

          <Form.Item name="description" label="تفاصيل المهمة">
            <Input.TextArea rows={3} placeholder="اكتب وصفاً مفصلاً للمهمة والمخرجات المطلوبة..." />
          </Form.Item>

          {/* إسناد المهمة (إذا كان مديراً يمكنه الاختيار، وإلا لنفسه) */}
          {(isExecutive || isManager) && (
            <Form.Item name="assigned_to" label="إسناد المهمة إلى">
              <Select placeholder="اختر الموظف المكلف (افتراضياً: لنفسك)">
                {(usersData || []).map((u: any) => (
                  <Select.Option key={u.id} value={u.id}>
                    {u.name} ({u.department_name || 'بدون قسم'})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="priority" label="أولوية المهمة" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="low">منخفضة</Select.Option>
              <Select.Option value="medium">متوسطة</Select.Option>
              <Select.Option value="high">مرتفعة</Select.Option>
              <Select.Option value="urgent">عاجل جداً</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="due_date"
            label="موعد التسليم"
            rules={[{ required: true, message: 'يرجى تحديد موعد التسليم' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <div style={{ textAlign: 'left', marginTop: 20 }}>
            <Space>
              <Button onClick={() => setCreateModalOpen(false)}>إلغاء</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTaskMutation.isPending}
                style={{ backgroundColor: '#258579' }}
              >
                إنشاء المهمة
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Drawer تفاصيل المهمة وتحديثها */}
      <Drawer
        title={selectedTask?.title || 'تفاصيل المهمة'}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedTask && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Space>
                {getPriorityTag(selectedTask.priority)}
                {getStatusTag(selectedTask.status)}
              </Space>
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                المكلف: <Text strong>{selectedTask.assigned_to_name}</Text> | موعد التسليم:{' '}
                <Text strong>{selectedTask.due_date}</Text>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <Text strong>الوصف:</Text>
                <Paragraph>{selectedTask.description}</Paragraph>
              </div>
            )}

            <Divider orientation="right">نسبة الإنجاز</Divider>
            <div>
              <Slider
                min={0}
                max={100}
                value={progressVal}
                onChange={(val) => setProgressVal(val)}
                disabled={selectedTask.status === 'approved'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>{progressVal}%</Text>
                {selectedTask.status !== 'approved' && (
                  <Button
                    size="small"
                    type="primary"
                    style={{ backgroundColor: '#258579' }}
                    onClick={() =>
                      updateProgressMutation.mutate({
                        taskId: selectedTask.id,
                        rate: progressVal,
                      })
                    }
                  >
                    حفظ نسبة الإنجاز
                  </Button>
                )}
              </div>
              {progressVal === 100 && selectedTask.status !== 'approved' && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="warning">
                    تنبيه: عند وصول الإنجاز إلى 100%، تنتقل المهمة لمرحلة المراجعة ولا تصبح مكتملة إلا بعد الاعتماد الإداري.
                  </Tag>
                </div>
              )}
            </div>

            {/* أزرار اعتماد المهمة */}
            {selectedTask.status === 'under_review' &&
              selectedTask.assigned_to !== user?.id &&
              (isExecutive || isManager || selectedTask.created_by === user?.id) && (
                <>
                  <Divider orientation="right">اعتماد إنجاز المهمة</Divider>
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      style={{ backgroundColor: '#2e7d32' }}
                      onClick={() =>
                        approveTaskMutation.mutate({
                          taskId: selectedTask.id,
                          action: 'approve',
                        })
                      }
                    >
                      اعتماد وإغلاق المهمة
                    </Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() =>
                        approveTaskMutation.mutate({
                          taskId: selectedTask.id,
                          action: 'reject',
                          notes: 'إعادة للتعديل واستكمال النواقص',
                        })
                      }
                    >
                      إعادة لعدم اكتمال الإنجاز
                    </Button>
                  </Space>
                </>
              )}

            <Divider orientation="right">التعليقات والمناقشة</Divider>
            <List
              size="small"
              dataSource={selectedTask.comments || []}
              locale={{ emptyText: 'لا توجد تعليقات بعد' }}
              renderItem={(c: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#258579' }} />}
                    title={
                      <Space>
                        <Text strong>{c.user_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {new Date(c.created_at).toLocaleString('ar-YE')}
                        </Text>
                      </Space>
                    }
                    description={c.content}
                  />
                </List.Item>
              )}
            />

            <Space.Compact style={{ width: '100%', marginTop: 8 }}>
              <Input
                placeholder="أضف تعليقاً أو استفساراً..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onPressEnter={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate({
                      taskId: selectedTask.id,
                      content: commentText.trim(),
                    });
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{ backgroundColor: '#258579' }}
                onClick={() => {
                  if (commentText.trim()) {
                    addCommentMutation.mutate({
                      taskId: selectedTask.id,
                      content: commentText.trim(),
                    });
                  }
                }}
              />
            </Space.Compact>
          </Space>
        )}
      </Drawer>
    </Card>
  );
};
