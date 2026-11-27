// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { PlansPage } from './features/plans/PlansPage';
import { TasksPage } from './features/tasks/TasksPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { ApprovalsPage } from './features/approvals/ApprovalsPage';
import { DepartmentsPage } from './features/departments/DepartmentsPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { UsersPage } from './features/admin/UsersPage';
import { AdminPage } from './features/admin/AdminPage';

// مكون حماية المسارات
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// مسار عام فقط للمستخدم غير المسجل
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* المسارات العامة */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* المسارات المحمية داخل الهيكل العام */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      {/* المسارات غير المعروفة */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
