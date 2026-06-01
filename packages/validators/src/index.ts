import { z } from 'zod';

const dateTimeString = z.string().min(1).refine(value => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid date/time',
});

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6).max(100),
  fullName: z.string().min(1).max(200),
}).refine(data => data.email || data.phone, {
  message: 'Email or phone is required',
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine(data => data.email || data.phone, {
  message: 'Email or phone is required',
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createCategorySchema = z.object({
  slug: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  translations: z.array(z.object({
    locale: z.enum(['ar', 'en']),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
  })).min(1),
});

export const updateCategorySchema = createCategorySchema.partial();

export const productTypeSchema = z.enum([
  'HOT_DRINK',
  'COLD_DRINK',
  'COFFEE_BEAN',
  'GROUND_COFFEE',
  'PACKAGE',
  'SUBSCRIPTION',
  'GIFT_CARD',
]);

export const createProductSchema = z.object({
  type: productTypeSchema,
  sku: z.string().min(1).max(50),
  categoryId: z.string().uuid(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isMaestroPick: z.boolean().default(false),
  imageUrl: z.string().optional(),
  basePreparationTimeMinutes: z.coerce.number().int().min(1).default(15),
  sortOrder: z.coerce.number().int().default(0),
  grindOptionIds: z.array(z.string().uuid()).optional(),
  images: z.array(z.object({
    url: z.string().min(1),
    altAr: z.string().optional(),
    altEn: z.string().optional(),
  })).optional(),
  translations: z.array(z.object({
    locale: z.enum(['ar', 'en']),
    name: z.string().min(1).max(200),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    microStory: z.string().optional(),
  })).min(1),
  variants: z.array(z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    sizeValue: z.coerce.number().positive().optional(),
    sizeUnit: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
    prices: z.array(z.object({
      id: z.string().uuid().optional(),
      currencyCode: z.string().min(1).max(3).transform(value => value.toUpperCase()),
      amount: z.coerce.number().positive(),
    })).min(1),
  })).min(1),
});

export const updateProductSchema = createProductSchema.partial();

export const createGrindOptionSchema = z.object({
  code: z.string().min(1).max(50),
  nameAr: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateGrindOptionSchema = createGrindOptionSchema.partial();

export const selectedOptionsSchema = z.object({
  grindType: z.enum(['whole_bean', 'ground']).optional(),
  grindOptionId: z.string().uuid().optional(),
}).passthrough();

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  currencyCode: z.string().min(1).max(3).transform(value => value.toUpperCase()).optional(),
  selectedOptions: selectedOptionsSchema.optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const createOrderSchema = z.object({
  pickupTime: dateTimeString,
  currencyCode: z.string().min(1).max(3).transform(value => value.toUpperCase()).optional(),
  notes: z.string().optional(),
});

export const createGuestOrderSchema = z.object({
  sessionId: z.string().min(1),
  guestName: z.string().min(1).max(200),
  guestPhone: z.string().min(7).max(20),
  pickupTime: dateTimeString,
  currencyCode: z.string().min(1).max(3).transform(value => value.toUpperCase()).optional(),
  notes: z.string().optional(),
});

export const claimRewardSchema = z.object({
  rewardClaimToken: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6).max(100),
  fullName: z.string().min(1).max(200),
}).refine(data => data.email || data.phone, {
  message: 'Email or phone is required',
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED']),
  reason: z.string().optional(),
});

export const reportFiltersSchema = z.object({
  fromDate: dateTimeString.optional(),
  toDate: dateTimeString.optional(),
  productId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateGrindOptionInput = z.infer<typeof createGrindOptionSchema>;
export type UpdateGrindOptionInput = z.infer<typeof updateGrindOptionSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;
export type ClaimRewardInput = z.infer<typeof claimRewardSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ReportFiltersInput = z.infer<typeof reportFiltersSchema>;
