# Data Model Overview

## Core Entities

```txt
User
Role
Permission
CustomerProfile
Category
CategoryTranslation
Product
ProductTranslation
ProductVariant
Price
Currency
CoffeeProfile
GrindOption
Cart
CartItem
Order
OrderItem
OrderStatusHistory
LoyaltyAccount
LoyaltyTransaction
QRCode
SubscriptionPlan
Subscription
CMSPage
Banner
SocialPost
Notification
AuditLog
Setting
```

## Product Types

```txt
HOT_DRINK
COLD_DRINK
COFFEE_BEAN
GROUND_COFFEE
PACKAGE
SUBSCRIPTION
GIFT_CARD
```

## Order Statuses

```txt
PENDING
ACCEPTED
PREPARING
READY_FOR_PICKUP
PICKED_UP
CANCELLED
```

## Payment Statuses

```txt
PENDING
PAID
FAILED
REFUNDED
CANCELLED
```

## Important Rules
- كل طلب يحفظ snapshot للأسعار والمنتجات.
- كل تعديل حساس يدخل AuditLog.
- الترجمات في جداول منفصلة.
- خيارات الطحن جداول مستقلة.
- النقاط Ledger وليست رقم فقط.
