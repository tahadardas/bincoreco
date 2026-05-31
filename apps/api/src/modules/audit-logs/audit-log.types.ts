export interface AuditLogContext {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry extends AuditLogContext {
  action: string;
  entityType: string;
  entityId: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
}

export const AuditActions = {
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DISABLED: 'PRODUCT_DISABLED',
  PRICE_CHANGED: 'PRICE_CHANGED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  LOYALTY_POINTS_ADJUSTED: 'LOYALTY_POINTS_ADJUSTED',
  GRIND_OPTION_UPDATED: 'GRIND_OPTION_UPDATED',
  SETTING_CHANGED: 'SETTING_CHANGED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
} as const;
