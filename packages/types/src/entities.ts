export interface UserEntity {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryEntity {
  id: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: CategoryTranslationEntity[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryTranslationEntity {
  categoryId: string;
  locale: string;
  name: string;
  description: string | null;
}

export interface ProductEntity {
  id: string;
  type: string;
  sku: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  imageUrl: string | null;
  basePreparationTimeMinutes: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: ProductTranslationEntity[];
  variants: ProductVariantEntity[];
  coffeeProfile: CoffeeProfileEntity | null;
}

export interface ProductTranslationEntity {
  productId: string;
  locale: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  microStory: string | null;
}

export interface ProductVariantEntity {
  id: string;
  productId: string;
  name: string;
  sizeValue: number | null;
  sizeUnit: string | null;
  isActive: boolean;
  sortOrder: number;
  prices: PriceEntity[];
}

export interface PriceEntity {
  id: string;
  productVariantId: string;
  currencyCode: string;
  amount: number;
  isActive: boolean;
}

export interface CoffeeProfileEntity {
  id: string;
  productId: string;
  originCountry: string | null;
  blendName: string | null;
  isSecretBlend: boolean;
  roastLevel: string | null;
  acidityLevel: number;
  bodyLevel: number;
  sweetnessLevel: number;
  bitternessLevel: number;
  caffeineLevel: number;
  flavorNotes: string[];
  recommendedMethods: string[];
  maestroNote: string | null;
}

export interface GrindOptionEntity {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderEntity {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  currencyCode: string;
  subtotal: number;
  discountTotal: number;
  loyaltyPointsUsed: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  pickupTime: string;
  notes: string | null;
  items: OrderItemEntity[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemEntity {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  productNameSnapshot: string;
  variantSnapshot: Record<string, unknown> | null;
  selectedOptionsSnapshot: Record<string, unknown> | null;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface AuditLogEntity {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
