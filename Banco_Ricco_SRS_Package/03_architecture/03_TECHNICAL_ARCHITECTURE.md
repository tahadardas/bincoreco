# Technical Architecture

## 1. Stack المقترح

```txt
Backend: NestJS + TypeScript
Database: PostgreSQL
ORM: Prisma
Website: Next.js
Admin Dashboard: Next.js
Mobile App: React Native + Expo
Notifications: Firebase Cloud Messaging
Storage: S3-compatible storage
Future Queue: Redis + BullMQ
```

## 2. المعمارية
ابدأ بـ Modular Monolith.

لا تبدأ Microservices. المشروع يحتاج سرعة إنتاج وضبط منطق العمل، لا حفلة سيرفرات كل واحد يغني مقام.

## 3. Monorepo Structure

```txt
banco-ricco/
  apps/
    api/
    website/
    admin/
    mobile/
  packages/
    ui/
    types/
    validators/
    config/
  docs/
    Banco_Ricco_SRS_Package/
  assets/
    brand/
      Banco Ricco Final Logo Big.pdf
      BR Banco Ricco Final Logo.pdf
```

## 4. Backend Modules

```txt
auth
users
roles
customers
categories
products
coffee-profiles
grind-options
cart
orders
pickup
loyalty
qr-cards
coffee-finder
subscriptions
cms
social-feed
currencies
reports
notifications
settings
audit-logs
```

## 5. قواعد API
- REST أولاً.
- Swagger إلزامي.
- Response موحد.
- Validation على كل DTO.
- Pagination لكل القوائم.
- Role-based access.
- Audit logs للعمليات الحساسة.
- لا منطق أعمال داخل الواجهة.

## 6. الأمان
- Password hashing.
- JWT + Refresh tokens.
- Rate limiting.
- Admin guards.
- Audit logs.
- Input validation.
- Soft delete للكيانات التجارية.

## 7. قابلية التوسع
- استخدام Redis/BullMQ لاحقاً للإشعارات والمهام.
- Caching للكتالوج لاحقاً.
- Indexes على status, customer_id, product_id, created_at.
- فصل واضح بين modules.
