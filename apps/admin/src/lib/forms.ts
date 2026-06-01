import { z } from 'zod';

export const phoneSchema = z.string().regex(/^[\d\+\s\-\(\)]{7,20}$/, 'رقم الهاتف غير صالح');
export const emailSchema = z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal(''));
export const requiredString = (label: string) => z.string().min(1, `${label} مطلوب`);
export const ratingSchema = z.coerce.number().int().min(1, 'التقييم من 1 إلى 5').max(5);

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
});

export const bannerFormSchema = z.object({
  titleAr: requiredString('العنوان (عربي)'),
  titleEn: requiredString('العنوان (English)'),
  link: z.string().optional(),
  startsAt: z.string().min(1, 'تاريخ البداية مطلوب'),
  endsAt: z.string().min(1, 'تاريخ النهاية مطلوب'),
}).refine(d => !d.endsAt || !d.startsAt || new Date(d.endsAt) > new Date(d.startsAt), {
  message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
  path: ['endsAt'],
});

export const reviewModerationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reply: z.string().optional(),
});

export const redeemSchema = z.object({
  points: z.coerce.number().int().min(1, 'النقاط يجب أن تكون 1 على الأقل'),
});
