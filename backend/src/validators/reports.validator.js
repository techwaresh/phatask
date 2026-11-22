// src/validators/reports.validator.js
import { z } from 'zod';

export const createReportSchema = {
  body: z.object({
    type: z.enum(['daily', 'weekly', 'monthly'], {
      required_error: 'نوع التقرير مطلوب (daily, weekly, monthly)',
    }),
    title: z.string({ required_error: 'عنوان التقرير مطلوب' }).min(3).max(255),
    period_start: z.string({ required_error: 'تاريخ بداية الفترة مطلوب' }),
    period_end: z.string({ required_error: 'تاريخ نهاية الفترة مطلوب' }),
    content: z.string().optional().nullable(),
    task_ids: z.array(z.number().int()).optional().default([]),
  }),
};

export const updateReportSchema = {
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    content: z.string().optional().nullable(),
    task_ids: z.array(z.number().int()).optional(),
  }),
};

export const autoGenerateReportSchema = {
  body: z.object({
    date: z.string().optional(), // YYYY-MM-DD (defaults to today)
  }),
};

export const reportApprovalSchema = {
  body: z.object({
    action: z.enum(['approve', 'reject', 'request_revision'], {
      required_error: 'نوع الإجراء مطلوب (approve, reject, request_revision)',
    }),
    notes: z.string().optional().nullable(),
  }).refine((data) => {
    if (data.action === 'reject' || data.action === 'request_revision') {
      return !!data.notes && data.notes.trim().length > 3;
    }
    return true;
  }, {
    message: 'يجب كتابة سبب واضح عند الرفض أو الإعادة للتعديل',
    path: ['notes'],
  }),
};
