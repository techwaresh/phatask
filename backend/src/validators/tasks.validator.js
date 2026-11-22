// src/validators/tasks.validator.js
import { z } from 'zod';

export const createTaskSchema = {
  body: z.object({
    title: z.string({ required_error: 'عنوان المهمة مطلوب' }).min(3).max(255),
    description: z.string().optional().nullable(),
    assigned_to: z.number().int().optional().nullable(),
    department_id: z.number().int().optional().nullable(),
    plan_id: z.number().int().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    due_date: z.string({ required_error: 'موعد التسليم مطلوب' }),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    due_date: z.string().optional(),
    assigned_to: z.number().int().optional().nullable(),
    completion_rate: z.number().min(0).max(100).optional(),
    status: z.enum(['pending', 'in_progress', 'under_review', 'approved', 'rejected', 'cancelled']).optional(),
    change_reason: z.string().optional(),
  }),
};

export const updateProgressSchema = {
  body: z.object({
    completion_rate: z.number({ required_error: 'نسبة الإنجاز مطلوبة' }).min(0).max(100),
    status: z.enum(['pending', 'in_progress', 'under_review']).optional(),
    note: z.string().optional(),
  }),
};

export const addCommentSchema = {
  body: z.object({
    content: z.string({ required_error: 'نص التعليق مطلوب' }).min(1),
  }),
};

export const approveTaskSchema = {
  body: z.object({
    action: z.enum(['approve', 'reject'], { required_error: 'الإجراء مطلوب (approve أو reject)' }),
    notes: z.string().optional().nullable(),
  }),
};
