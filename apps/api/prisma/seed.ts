import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'maestro@banco-ricco.com' },
    update: {},
    create: {
      email: 'maestro@banco-ricco.com',
      fullName: 'Banco Maestro',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin.email);

  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      fullName: 'Ahmed Customer',
      passwordHash: customerPassword,
      role: 'customer',
    },
  });
  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id },
  });
  console.log('Customer user created:', customer.email);

  const categories = [
    { slug: 'hot-drinks', translations: [{ locale: 'ar', name: 'مشروبات ساخنة', description: 'مشروبات ساخنة مميزة' }, { locale: 'en', name: 'Hot Drinks', description: 'Signature hot drinks' }] },
    { slug: 'cold-drinks', translations: [{ locale: 'ar', name: 'مشروبات باردة', description: 'مشروبات باردة منعشة' }, { locale: 'en', name: 'Cold Drinks', description: 'Refreshing cold drinks' }] },
    { slug: 'coffee-beans', translations: [{ locale: 'ar', name: 'حبوب البن', description: 'حب كامل ومطحون' }, { locale: 'en', name: 'Coffee Beans', description: 'Whole bean and ground coffee' }] },
    { slug: 'signature', translations: [{ locale: 'ar', name: 'توقيع بانكو', description: 'منتجات حصرية' }, { locale: 'en', name: 'Banco Signature', description: 'Exclusive products' }] },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        translations: { create: cat.translations },
      },
    });
  }
  console.log('Categories created');

  const hotCategory = await prisma.category.findUnique({ where: { slug: 'hot-drinks' } });
  const beansCategory = await prisma.category.findUnique({ where: { slug: 'coffee-beans' } });
  const signatureCategory = await prisma.category.findUnique({ where: { slug: 'signature' } });

  const products = [
    {
      type: 'HOT_DRINK' as const,
      sku: 'BR-ESP-001',
      categoryId: hotCategory!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 1,
      translations: [
        { locale: 'ar', name: 'إسبريسو', shortDescription: 'قهوة إسبريسو مركزة', description: 'إسبريسو إيطالي أصيل' },
        { locale: 'en', name: 'Espresso', shortDescription: 'Concentrated espresso', description: 'Authentic Italian espresso' },
      ],
      variants: [{ name: 'Single', prices: [{ currencyCode: 'SYP', amount: 15000 }] }, { name: 'Double', prices: [{ currencyCode: 'SYP', amount: 25000 }] }],
    },
    {
      type: 'HOT_DRINK' as const,
      sku: 'BR-AMR-001',
      categoryId: hotCategory!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 2,
      translations: [
        { locale: 'ar', name: 'أمريكان كوفي', shortDescription: 'قهوة أمريكية', description: 'قهوة أمريكية ناعمة' },
        { locale: 'en', name: 'American Coffee', shortDescription: 'American coffee', description: 'Smooth American coffee' },
      ],
      variants: [{ name: 'Regular', prices: [{ currencyCode: 'SYP', amount: 20000 }] }, { name: 'Large', prices: [{ currencyCode: 'SYP', amount: 30000 }] }],
    },
    {
      type: 'HOT_DRINK' as const,
      sku: 'BR-3IN1-001',
      categoryId: hotCategory!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 3,
      sortOrder: 3,
      translations: [
        { locale: 'ar', name: '3 في 1', shortDescription: 'قهوة 3 في 1', description: 'قهوة 3 في 1 سريعة' },
        { locale: 'en', name: '3 in 1', shortDescription: '3 in 1 coffee', description: 'Quick 3 in 1 coffee' },
      ],
      variants: [{ name: 'Cup', prices: [{ currencyCode: 'SYP', amount: 10000 }] }],
    },
    {
      type: 'HOT_DRINK' as const,
      sku: 'BR-RED-001',
      categoryId: hotCategory!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 4,
      translations: [
        { locale: 'ar', name: 'ريد آي', shortDescription: 'ريد آي', description: 'ريد آي - إسبريسو مع قهوة' },
        { locale: 'en', name: 'Red Eye', shortDescription: 'Red Eye', description: 'Red Eye - espresso meets coffee' },
      ],
      variants: [{ name: 'Regular', prices: [{ currencyCode: 'SYP', amount: 25000 }] }],
    },
    {
      type: 'COFFEE_BEAN' as const,
      sku: 'BR-V60-COL',
      categoryId: beansCategory!.id,
      isMaestroPick: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 10,
      translations: [
        { locale: 'ar', name: 'V60 كولومبي', shortDescription: 'قهوة كولومبية V60', description: 'قهوة كولومبية للتحضير بطريقة V60' },
        { locale: 'en', name: 'V60 Colombia', shortDescription: 'Colombian V60 coffee', description: 'Colombian coffee for V60 brewing' },
      ],
      variants: [
        { name: '250g', sizeValue: 250, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 45000 }] },
        { name: '500g', sizeValue: 500, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 80000 }] },
      ],
    },
    {
      type: 'COFFEE_BEAN' as const,
      sku: 'BR-V60-ETH',
      categoryId: beansCategory!.id,
      isMaestroPick: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 11,
      translations: [
        { locale: 'ar', name: 'V60 إثيوبي', shortDescription: 'قهوة إثيوبية V60', description: 'قهوة إثيوبية للتحضير بطريقة V60' },
        { locale: 'en', name: 'V60 Ethiopia', shortDescription: 'Ethiopian V60 coffee', description: 'Ethiopian coffee for V60 brewing' },
      ],
      variants: [
        { name: '250g', sizeValue: 250, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 50000 }] },
      ],
    },
    {
      type: 'COFFEE_BEAN' as const,
      sku: 'BR-V60-BRA',
      categoryId: beansCategory!.id,
      basePreparationTimeMinutes: 5,
      sortOrder: 12,
      translations: [
        { locale: 'ar', name: 'V60 برازيلي', shortDescription: 'قهوة برازيلية V60', description: 'قهوة برازيلية للتحضير بطريقة V60' },
        { locale: 'en', name: 'V60 Brazil', shortDescription: 'Brazilian V60 coffee', description: 'Brazilian coffee for V60 brewing' },
      ],
      variants: [{ name: '250g', sizeValue: 250, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 40000 }] }],
    },
    {
      type: 'COFFEE_BEAN' as const,
      sku: 'BR-SHAMI-001',
      categoryId: beansCategory!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 13,
      translations: [
        { locale: 'ar', name: 'قهوة شامية', shortDescription: 'قهوة شامية تقليدية', description: 'قهوة شامية محمصة على الطريقة الدمشقية' },
        { locale: 'en', name: 'Shami Coffee', shortDescription: 'Traditional Shami coffee', description: 'Damascus-style roasted Shami coffee' },
      ],
      variants: [
        { name: '250g', sizeValue: 250, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 35000 }] },
        { name: '500g', sizeValue: 500, sizeUnit: 'g', prices: [{ currencyCode: 'SYP', amount: 65000 }] },
      ],
    },
    {
      type: 'HOT_DRINK' as const,
      sku: 'BR-SPEC-1L',
      categoryId: signatureCategory!.id,
      isFeatured: true,
      basePreparationTimeMinutes: 10,
      sortOrder: 20,
      translations: [
        { locale: 'ar', name: 'B.R Special Coffee 1L', shortDescription: 'قهوة بانكو الخاصة', description: 'قهوة بانكو الخاصة لتر كامل' },
        { locale: 'en', name: 'B.R Special Coffee 1L', shortDescription: 'Banco Ricco special coffee', description: 'Banco Ricco special coffee 1 liter' },
      ],
      variants: [{ name: '1L', sizeValue: 1, sizeUnit: 'L', prices: [{ currencyCode: 'SYP', amount: 60000 }] }],
    },
    {
      type: 'COLD_DRINK' as const,
      sku: 'BR-ICE-001',
      categoryId: (await prisma.category.findUnique({ where: { slug: 'cold-drinks' } }))!.id,
      isBestSeller: true,
      basePreparationTimeMinutes: 5,
      sortOrder: 30,
      translations: [
        { locale: 'ar', name: 'آيس كوفي', shortDescription: 'قهوة مثلجة', description: 'قهوة مثلجة منعشة' },
        { locale: 'en', name: 'Ice Coffee', shortDescription: 'Iced coffee', description: 'Refreshing iced coffee' },
      ],
      variants: [{ name: 'Regular', prices: [{ currencyCode: 'SYP', amount: 25000 }] }, { name: 'Large', prices: [{ currencyCode: 'SYP', amount: 35000 }] }],
    },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    if (!existing) {
      await prisma.product.create({
        data: {
          type: prod.type,
          sku: prod.sku,
          categoryId: prod.categoryId,
          isBestSeller: prod.isBestSeller ?? false,
          isFeatured: prod.isFeatured ?? false,
          isMaestroPick: prod.isMaestroPick ?? false,
          basePreparationTimeMinutes: prod.basePreparationTimeMinutes,
          sortOrder: prod.sortOrder,
          translations: { create: prod.translations },
          variants: {
            create: prod.variants.map(v => ({
              name: v.name,
              sizeValue: (v as any).sizeValue,
              sizeUnit: (v as any).sizeUnit,
              prices: { create: v.prices },
            })),
          },
        },
      });
    }
  }
  console.log('Products created');

  const coffeeProfiles = [
    { sku: 'BR-V60-COL', originCountry: 'Colombia', blendName: 'Colombian Supremo', roastLevel: 'MEDIUM', acidityLevel: 7, bodyLevel: 6, sweetnessLevel: 7, bitternessLevel: 3, caffeineLevel: 5, flavorNotes: ['Caramel', 'Chocolate', 'Citrus'], recommendedMethods: ['V60', 'Pour Over'], maestroNote: 'نكهة متوازنة مع حموضة مشرقة' },
    { sku: 'BR-V60-ETH', originCountry: 'Ethiopia', blendName: 'Yirgacheffe', roastLevel: 'LIGHT', acidityLevel: 8, bodyLevel: 4, sweetnessLevel: 8, bitternessLevel: 2, caffeineLevel: 4, flavorNotes: ['Floral', 'Berry', 'Tea-like'], recommendedMethods: ['V60', 'Pour Over'], maestroNote: 'نكهات زهرية مع قوام خفيف كالشاي' },
    { sku: 'BR-V60-BRA', originCountry: 'Brazil', blendName: 'Santos', roastLevel: 'MEDIUM_DARK', acidityLevel: 4, bodyLevel: 8, sweetnessLevel: 6, bitternessLevel: 5, caffeineLevel: 6, flavorNotes: ['Nuts', 'Chocolate', 'Caramel'], recommendedMethods: ['V60', 'French Press'], maestroNote: 'قوام كامل ونكهة شوكولاتة غنية' },
    { sku: 'BR-SHAMI-001', originCountry: 'Syria', blendName: 'Damascus Blend', isSecretBlend: true, roastLevel: 'DARK', acidityLevel: 3, bodyLevel: 9, sweetnessLevel: 5, bitternessLevel: 8, caffeineLevel: 7, flavorNotes: ['Spices', 'Dark Chocolate', 'Smoky'], recommendedMethods: ['TURKISH_SHAMI', 'MOKA_POT'], maestroNote: 'خلطة دمشقية تقليدية بقوام ثقيل' },
  ];

  for (const profile of coffeeProfiles) {
    const product = await prisma.product.findUnique({ where: { sku: profile.sku } });
    if (product) {
      const existing = await prisma.coffeeProfile.findUnique({ where: { productId: product.id } });
      if (!existing) {
        await prisma.coffeeProfile.create({
          data: {
            productId: product.id,
            originCountry: profile.originCountry,
            blendName: profile.blendName,
            isSecretBlend: profile.isSecretBlend ?? false,
            roastLevel: profile.roastLevel,
            acidityLevel: profile.acidityLevel,
            bodyLevel: profile.bodyLevel,
            sweetnessLevel: profile.sweetnessLevel,
            bitternessLevel: profile.bitternessLevel,
            caffeineLevel: profile.caffeineLevel,
            flavorNotes: profile.flavorNotes,
            recommendedMethods: profile.recommendedMethods,
            maestroNote: profile.maestroNote,
          },
        });
      }
    }
  }
  console.log('Coffee profiles created');

  const banners = [
    {
      imageUrl: '/images/banner-1.jpg', linkUrl: '/products',
      sortOrder: 1, isActive: true,
      translations: [
        { locale: 'ar', title: 'قهوة استثنائية', subtitle: 'اكتشف تشكيلتنا المميزة' },
        { locale: 'en', title: 'Exceptional Coffee', subtitle: 'Discover our signature collection' },
      ],
    },
    {
      imageUrl: '/images/banner-2.jpg', linkUrl: '/products?type=COFFEE_BEAN',
      sortOrder: 2, isActive: true,
      translations: [
        { locale: 'ar', title: 'البن الطازج', subtitle: 'حب كامل أو مطحون حسب طلبك' },
        { locale: 'en', title: 'Fresh Beans', subtitle: 'Whole bean or ground to order' },
      ],
    },
  ];

  for (const banner of banners) {
    await prisma.banner.create({
      data: {
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        sortOrder: banner.sortOrder,
        isActive: banner.isActive,
        translations: { create: banner.translations },
      },
    });
  }
  console.log('Banners created');

  const grindOptions = [
    { code: 'WHOLE_BEAN', nameAr: 'حب كامل', nameEn: 'Whole Bean', sortOrder: 1 },
    { code: 'ESPRESSO', nameAr: 'إسبريسو', nameEn: 'Espresso', sortOrder: 2 },
    { code: 'TURKISH_SHAMI', nameAr: 'شامي/تركي', nameEn: 'Turkish/Shami', sortOrder: 3 },
    { code: 'V60', nameAr: 'V60', nameEn: 'V60', sortOrder: 4 },
    { code: 'AMERICAN_COFFEE', nameAr: 'أمريكية', nameEn: 'American Coffee', sortOrder: 5 },
    { code: 'MOKA_POT', nameAr: 'موكا بوت', nameEn: 'Moka Pot', sortOrder: 6 },
    { code: 'FRENCH_PRESS', nameAr: 'فرنش برس', nameEn: 'French Press', sortOrder: 7 },
    { code: 'COLD_BREW', nameAr: 'كولد برو', nameEn: 'Cold Brew', sortOrder: 8 },
  ];

  for (const opt of grindOptions) {
    await prisma.grindOption.upsert({
      where: { code: opt.code },
      update: {},
      create: opt,
    });
  }
  console.log('Grind options created');

  const grindLinksBySku: Record<string, string[]> = {
    'BR-V60-COL': ['V60', 'ESPRESSO', 'AMERICAN_COFFEE', 'FRENCH_PRESS'],
    'BR-V60-ETH': ['V60', 'ESPRESSO', 'AMERICAN_COFFEE'],
    'BR-V60-BRA': ['V60', 'FRENCH_PRESS', 'MOKA_POT'],
    'BR-SHAMI-001': ['TURKISH_SHAMI', 'MOKA_POT', 'ESPRESSO'],
  };

  for (const [sku, grindCodes] of Object.entries(grindLinksBySku)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) continue;

    const linkedOptions = await prisma.grindOption.findMany({
      where: { code: { in: grindCodes } },
    });

    for (const option of linkedOptions) {
      await prisma.productGrindOption.upsert({
        where: {
          productId_grindOptionId: {
            productId: product.id,
            grindOptionId: option.id,
          },
        },
        update: {
          isActive: true,
          sortOrder: option.sortOrder,
        },
        create: {
          productId: product.id,
          grindOptionId: option.id,
          isActive: true,
          sortOrder: option.sortOrder,
        },
      });
    }
  }
  console.log('Product grind options linked');

  await prisma.setting.upsert({
    where: { key: 'default_currency' },
    update: {},
    create: { key: 'default_currency', value: 'SYP' },
  });
  await prisma.setting.upsert({
    where: { key: 'default_locale' },
    update: {},
    create: { key: 'default_locale', value: 'ar' },
  });
  await prisma.setting.upsert({
    where: { key: 'default_preparation_time' },
    update: {},
    create: { key: 'default_preparation_time', value: '15' },
  });
  await prisma.setting.upsert({
    where: { key: 'pickup_enabled' },
    update: {},
    create: { key: 'pickup_enabled', value: 'true' },
  });
  await prisma.setting.upsert({
    where: { key: 'stamp_target' },
    update: {},
    create: { key: 'stamp_target', value: '10' },
  });
  await prisma.setting.upsert({
    where: { key: 'points_per_unit' },
    update: {},
    create: { key: 'points_per_unit', value: '1000' },
  });
  console.log('Settings created');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
