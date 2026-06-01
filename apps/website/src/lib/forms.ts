import { z } from 'zod';

export const requiredString = (label: string) => z.string().min(1, `${label} مطلوب`);
export const phoneSchema = z.string().regex(/^[\d\+\s\-\(\)]{7,20}$/, 'رقم الهاتف غير صالح');
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal(''));

export const contactFormSchema = z.object({
  fullName: requiredString('الاسم'),
  phone: phoneSchema,
  email: emailSchema,
  subject: z.string().optional(),
  message: z.string().min(1, 'الرسالة مطلوبة').max(2000, 'الرسالة طويلة جداً'),
});

export const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, 'اختر تقييماً').max(5),
  comment: z.string().min(1, 'اكتب تعليقاً').max(1000, 'التعليق طويل جداً'),
});

export const guestOrderSchema = z.object({
  fullName: requiredString('الاسم'),
  phone: phoneSchema,
  pickupTime: z.string().min(1, 'وقت الاستلام مطلوب'),
});

export const authSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
  fullName: z.string().optional(),
});
