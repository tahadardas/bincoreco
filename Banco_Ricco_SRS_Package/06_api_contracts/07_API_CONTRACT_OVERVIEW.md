# API Contract Overview

## Standard Success Response

```json
{
  "success": true,
  "data": {},
  "message": null,
  "errors": null,
  "meta": {}
}
```

## Standard Error Response

```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name is required" }
  ],
  "meta": {}
}
```

## Public APIs

```txt
POST /auth/register
POST /auth/login
POST /auth/refresh
GET /categories
GET /products
GET /products/:id
GET /grind-options
POST /cart/items
GET /cart
POST /orders
GET /orders/my
GET /orders/:id
GET /coffee-finder/questions
POST /coffee-finder/recommend
GET /loyalty/me
GET /customers/me/qr-card
```

## Admin APIs

```txt
GET /admin/dashboard
GET /admin/orders
PATCH /admin/orders/:id/status
POST /admin/products
PATCH /admin/products/:id
PATCH /admin/products/:id/status
POST /admin/categories
PATCH /admin/categories/:id
POST /admin/grind-options
PATCH /admin/grind-options/:id
GET /admin/reports/top-products
POST /admin/loyalty/adjust
POST /admin/social-posts
PATCH /admin/settings
```

## API Rules
- Admin APIs require Auth + Permission.
- كل القوائم تدعم pagination.
- كل DTO له validation.
- كل response موحد.
- لا stack trace للعميل.
