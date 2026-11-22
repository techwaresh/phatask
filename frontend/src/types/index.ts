// src/types/index.ts

export type RoleName = 'executive_director' | 'department_manager' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  department_id?: number | null;
  department_name?: string;
  department?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  roles: string[] | { name: string; displayName: string }[];
  permissions?: string[];
  avatar_url?: string | null;
  is_active?: boolean;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  manager_id?: number | null;
  manager_name?: string | null;
  manager_email?: string | null;
  description?: string | null;
  is_active: boolean;
  member_count?: number;
  members?: User[];
}

export type PlanType = 'daily' | 'weekly' | 'monthly';
export type PlanStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

export interface PlanItem {
  id?: number;
  plan_id?: number;
  item_type: 'goal' | 'activity' | 'expected_result';
  content: string;
  order_index: number;
  completion_rate: number;
}

export interface Plan {
  id: number;
  user_id: number;
  user_name?: string;
  department_id?: number | null;
  department_name?: string;
  type: PlanType;
  title: string;
  period_start: string;
  period_end: string;
  status: PlanStatus;
  notes?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  items?: PlanItem[];
  approval_steps?: ApprovalStep[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  created_by: number;
  created_by_name?: string;
  assigned_to?: number | null;
  assigned_to_name?: string;
  assigned_to_avatar?: string | null;
  department_id?: number | null;
  department_name?: string;
  plan_id?: number | null;
  plan_title?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completion_rate: number;
  due_date: string;
  completed_at?: string | null;
  approved_at?: string | null;
  approved_by_name?: string | null;
  created_at: string;
  comments?: TaskComment[];
  attachments?: FileAttachment[];
  history?: TaskHistory[];
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
}

export interface TaskHistory {
  id: number;
  task_id: number;
  changed_by: number;
  changed_by_name: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  change_reason?: string | null;
  created_at: string;
}

export interface FileAttachment {
  id: number;
  original_name: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  public_url?: string | null;
  created_at: string;
}

export type ReportType = 'daily' | 'weekly' | 'monthly';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';

export interface Report {
  id: number;
  user_id: number;
  user_name?: string;
  department_id?: number | null;
  department_name?: string;
  type: ReportType;
  title: string;
  period_start: string;
  period_end: string;
  content?: string | null;
  is_auto_generated: boolean;
  status: ReportStatus;
  submitted_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  tasks?: (Task & { report_notes?: string })[];
  attachments?: FileAttachment[];
  approval_steps?: ApprovalStep[];
}

export interface ApprovalStep {
  id: number;
  entity_type: 'plan' | 'report' | 'task';
  entity_id: number;
  step_order: number;
  approver_id: number;
  approver_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  notes?: string | null;
  acted_at?: string | null;
  created_at: string;
  entity_details?: Plan | Report;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
  is_read: boolean;
  created_at: string;
}
