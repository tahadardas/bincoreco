# F18 — Security & Audit Logs

## Phase
Phase 0 / Phase 1

## الهدف
حماية النظام وتوثيق التعديلات الحساسة.

## Audit Events
```txt
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_DISABLED
PRICE_CHANGED
ORDER_STATUS_CHANGED
LOYALTY_POINTS_ADJUSTED
CURRENCY_CHANGED
USER_ROLE_CHANGED
SUBSCRIPTION_UPDATED
PAYMENT_STATUS_CHANGED
```

## قواعد العمل
- لا تعديل سعر دون Audit Log.
- لا تعديل نقاط دون سبب.
- لا حذف نهائي للمنتجات في التشغيل العادي.
- لا تخزن Tokens أو كلمات مرور في logs.

## Acceptance Criteria
- كل عملية حساسة مسجلة.
- يمكن مراجعة تاريخ التغييرات.
- الصلاحيات تمنع الوصول غير المصرح.
