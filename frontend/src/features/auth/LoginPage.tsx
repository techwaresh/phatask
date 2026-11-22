// src/features/auth/LoginPage.tsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setErrorMsg(null);
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        'فشل تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور';
      setErrorMsg(msg);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #173F45 0%, #258579 100%)',
        padding: 20,
        direction: 'rtl',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: '#258579',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
              fontWeight: 'bold',
              marginBottom: 12,
            }}
          >
            ب
          </div>
          <Title level={3} style={{ margin: 0, color: '#173F45' }}>
            نظام إدارة العمل (BWMS)
          </Title>
          <Text type="secondary">مؤسسة بصمة للأعمال الإنسانية</Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="البريد الإلكتروني"
            rules={[
              { required: true, message: 'يرجى إدخال البريد الإلكتروني' },
              { type: 'email', message: 'صيغة البريد غير صالحة' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#aaa' }} />}
              placeholder="example@gmail.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="كلمة المرور"
            rules={[{ required: true, message: 'يرجى إدخال كلمة المرور' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#aaa' }} />}
              placeholder="••••••••"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              style={{
                backgroundColor: '#258579',
                borderColor: '#258579',
                fontWeight: 600,
                marginTop: 8,
              }}
            >
              تسجيل الدخول
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            نظام مؤسسي محمي ومخصص لموظفي مؤسسة بصمة
          </Text>
        </div>
      </Card>
    </div>
  );
};
