// src/validators/auth.validator.js
import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'البريد الإلكتروني مطلوب' })
      .email('صيغة البريد الإلكتروني غير صالحة')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'كلمة المرور مطلوبة' })
      .min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z
      .string({ required_error: 'رمز التجديد مطلوب' })
      .min(10, 'رمز التجديد غير صالح'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z
      .string({ required_error: 'كلمة المرور الحالية مطلوبة' })
      .min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string({ required_error: 'كلمة المرور الجديدة مطلوبة' })
      .min(8, 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام'
      ),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'البريد الإلكتروني مطلوب' })
      .email('صيغة البريد الإلكتروني غير صالحة')
      .trim()
      .toLowerCase(),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string({ required_error: 'رمز التحقق مطلوب' }),
    newPassword: z
      .string({ required_error: 'كلمة المرور الجديدة مطلوبة' })
      .min(8, 'كلمة المرور الجديدة يجب أن لا تقل عن 8 أحرف'),
  }),
};
