# F16 — Payments Future

## Phase
Phase 4

## القرار الحالي
الدفع أونلاين غير ضروري في Phase 1.

## طرق مستقبلية
```txt
CASH_ON_PICKUP
ONLINE_CARD
NFC
WALLET
GIFT_CARD
LOYALTY_POINTS
```

## حقول يجب تحضيرها من البداية
```txt
payment_method
payment_status
paid_at
payment_reference
payment_provider
```

## Acceptance Criteria مستقبلاً
- الدفع الإلكتروني يعمل بعد تأكيد مزود الدفع.
- يوجد تقرير تسوية مدفوعات.
- لا يتم اعتبار الطلب Paid إلا بتأكيد فعلي.
