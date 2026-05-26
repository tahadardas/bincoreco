# F01 — Product Catalog

## Phase
Phase 1

## الهدف
إدارة وعرض منتجات Banco Ricco بطريقة واضحة وسريعة، مع إبراز المنتجات الأكثر مبيعاً وتجنب تشتيت العميل.

## النطاق
- التصنيفات.
- المنتجات الساخنة والباردة.
- منتجات البن.
- منتجات Signature.
- الصور.
- الأسعار.
- الترجمات.
- الترتيب.
- Best Sellers.
- Maestro Picks.

## المنتجات التي يجب إبرازها
1. Espresso
2. American Coffee
3. 3 in 1
4. Ice Coffee
5. Red Eye
6. B.R Special Coffee 1L

## حقول المنتج
```txt
id
sku
type
category_id
is_active
is_featured
is_best_seller
is_maestro_pick
image_url
base_preparation_time_minutes
sort_order
created_at
updated_at
deleted_at
```

## حقول الترجمة
```txt
product_id
locale
name
short_description
description
micro_story
```

## متطلبات لوحة التحكم
- إضافة/تعديل/إخفاء منتج.
- رفع صورة.
- تحديد التصنيف.
- تحديد السعر.
- تحديد الأكثر مبيعاً.
- تحديد اختيار المايسترو.
- إدخال نص عربي وإنكليزي.
- ترتيب المنتجات.

## قواعد العمل
- لا يظهر منتج غير مفعّل للعملاء.
- لا ينشر منتج دون اسم وسعر في اللغة والعملة الافتراضية.
- لا تعرض كل المنتجات دفعة واحدة في Home.

## Acceptance Criteria
- يستطيع المايسترو إدارة المنتجات دون مطور.
- العميل يرى المنتجات المفعّلة فقط.
- المنتجات الأكثر مبيعاً ظاهرة في الواجهة.
- المنتج يدعم العربية والإنكليزية.
