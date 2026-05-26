# Database Entities Draft

## users
```txt
id uuid pk
email varchar unique nullable
phone varchar unique nullable
password_hash varchar nullable
full_name varchar
is_active boolean
created_at timestamp
updated_at timestamp
```

## products
```txt
id uuid pk
type varchar
sku varchar unique
category_id uuid
is_active boolean
is_featured boolean
is_best_seller boolean
is_maestro_pick boolean
image_url text
base_preparation_time_minutes int
sort_order int
created_at timestamp
updated_at timestamp
deleted_at timestamp nullable
```

## product_translations
```txt
product_id uuid
locale varchar
name varchar
short_description text
description text
micro_story text
```

## product_variants
```txt
id uuid pk
product_id uuid
name varchar
size_value numeric nullable
size_unit varchar nullable
is_active boolean
sort_order int
```

## prices
```txt
id uuid pk
product_variant_id uuid
currency_code varchar
amount numeric
is_active boolean
```

## coffee_profiles
```txt
id uuid pk
product_id uuid
origin_country varchar
blend_name varchar
is_secret_blend boolean
roast_level varchar
acidity_level int
body_level int
sweetness_level int
bitterness_level int
caffeine_level int
flavor_notes jsonb
recommended_methods jsonb
maestro_note text
```

## grind_options
```txt
id uuid pk
code varchar unique
name_ar varchar
name_en varchar
description_ar text
description_en text
is_active boolean
sort_order int
```

## orders
```txt
id uuid pk
order_number varchar unique
customer_id uuid
status varchar
currency_code varchar
subtotal numeric
discount_total numeric
loyalty_points_used int
total numeric
payment_method varchar
payment_status varchar
pickup_time timestamp
notes text
created_at timestamp
updated_at timestamp
```

## order_items
```txt
id uuid pk
order_id uuid
product_id uuid
variant_id uuid
product_name_snapshot varchar
variant_snapshot jsonb
selected_options_snapshot jsonb
unit_price numeric
quantity int
total numeric
```

## loyalty_accounts
```txt
id uuid pk
customer_id uuid unique
balance int
lifetime_earned int
lifetime_redeemed int
```

## loyalty_transactions
```txt
id uuid pk
loyalty_account_id uuid
type varchar
points int
reason text
order_id uuid nullable
created_by uuid nullable
created_at timestamp
```

## qr_cards
```txt
id uuid pk
customer_id uuid
public_token varchar unique
is_active boolean
regenerated_at timestamp nullable
created_at timestamp
```

## audit_logs
```txt
id uuid pk
actor_user_id uuid
action varchar
entity_type varchar
entity_id uuid
before_snapshot jsonb
after_snapshot jsonb
ip_address varchar
user_agent text
created_at timestamp
```
