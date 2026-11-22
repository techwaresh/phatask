// src/validators/plans.validator.js
import { z } from 'zod';

export const createPlanSchema = {
  body: z.object({
    type: z.enum(['daily', 'weekly', 'monthly'], {
      required_error: 'نوع الخطة مطلوب (يومية/أسبوعية/شهرية)',
    }),
    title: z.string({ required_error: 'عنوان الخطة مطلوب' }).min(3).max(255),
    period_start: z.string({ required_error: 'تاريخ بداية الفترة مطلوب' }),
    period_end: z.string({ required_error: 'تاريخ نهاية الفترة مطلوب' }),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          item_type: z.enum(['goal', 'activity', 'expected_result']),
          content: z.string({ required_error: 'محتوى البند مطلوب' }).min(2),
          order_index: z.number().int().optional().default(0),
          completion_rate: z.number().min(0).max(100).optional().default(0),
        })
      )
      .optional()
      .default([]),
  }),
};

export const updatePlanSchema = {
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    period_start: z.string().optional(),
    period_end: z.string().optional(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          id: z.number().optional(),
          item_type: z.enum(['goal', 'activity', 'expected_result']),
          content: z.string().min(2),
          order_index: z.number().int().optional().default(0),
          completion_rate: z.number().min(0).max(100).optional().default(0),
        })
      )
      .optional(),
  }),
};

export const approvalActionSchema = {
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
    message: 'يجب ذكر سبب واضح ومفصل عند الرفض أو الإعادة للتعديل',
    path: ['notes'],
  }),
};
