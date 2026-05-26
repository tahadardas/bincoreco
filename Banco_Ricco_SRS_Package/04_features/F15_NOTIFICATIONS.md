# F15 — Notifications

## Phase
Phase 2

## الهدف
تنبيه العميل بحالة الطلب والعروض والنقاط.

## الأنواع
```txt
ORDER_ACCEPTED
ORDER_PREPARING
ORDER_READY
ORDER_CANCELLED
LOYALTY_EARNED
OFFER
SUBSCRIPTION_REMINDER
```

## القنوات
- Push عبر Firebase.
- In-app notifications.
- Email/SMS لاحقاً.

## Acceptance Criteria
- العميل يتلقى إشعاراً عند جاهزية الطلب.
- يمكن تخزين Device Token.
- يمكن قراءة الإشعارات داخل التطبيق.
