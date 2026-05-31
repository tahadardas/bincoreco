'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminFetch, adminUpload } from '@/lib/api';

type ProductType = 'HOT_DRINK' | 'COLD_DRINK' | 'COFFEE_BEAN' | 'GROUND_COFFEE' | 'PACKAGE';

interface Category {
  id: string;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface GrindOption {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

interface TranslationForm {
  locale: 'ar' | 'en';
  name: string;
  shortDescription: string;
  description: string;
  microStory: string;
}

interface PriceForm {
  currencyCode: string;
  amount: number;
}

interface VariantForm {
  name: string;
  sizeValue: number | null;
  sizeUnit: string;
  isActive: boolean;
  sortOrder: number;
  prices: PriceForm[];
}

interface ProductForm {
  type: ProductType;
  sku: string;
  categoryId: string;
  isActive: boolean;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  isFeatured: boolean;
  imageUrl: string;
  images: { id?: string; url: string; altAr?: string; altEn?: string; isPrimary?: boolean; sortOrder?: number }[];
  basePreparationTimeMinutes: number;
  sortOrder: number;
  translations: TranslationForm[];
  variants: VariantForm[];
  grindOptionIds: string[];
}

const productTypeLabels: Record<ProductType, string> = {
  HOT_DRINK: 'مشروب ساخن',
  COLD_DRINK: 'مشروب بارد',
  COFFEE_BEAN: 'بن حب',
  GROUND_COFFEE: 'بن مطحون',
  PACKAGE: 'باقة',
};

const productTypes = Object.keys(productTypeLabels) as ProductType[];

const emptyForm: ProductForm = {
  type: 'HOT_DRINK',
  sku: '',
  categoryId: '',
  isActive: true,
  isBestSeller: false,
  isMaestroPick: false,
  isFeatured: false,
  imageUrl: '',
  images: [],
  basePreparationTimeMinutes: 15,
  sortOrder: 0,
  translations: [
    { locale: 'ar', name: '', shortDescription: '', description: '', microStory: '' },
    { locale: 'en', name: '', shortDescription: '', description: '', microStory: '' },
  ],
  variants: [
    {
      name: 'Regular',
      sizeValue: null,
      sizeUnit: '',
      isActive: true,
      sortOrder: 0,
      prices: [{ currencyCode: 'SYP', amount: 0 }],
    },
  ],
  grindOptionIds: [],
};

function localizedName(translations: { locale: string; name: string }[], fallback: string) {
  return translations.find(translation => translation.locale === 'ar')?.name
    || translations.find(translation => translation.locale === 'en')?.name
    || fallback;
}

function normalizeTranslations(translations: Partial<TranslationForm>[] = []): TranslationForm[] {
  return emptyForm.translations.map(defaultTranslation => {
    const existing = translations.find(translation => translation.locale === defaultTranslation.locale);
    return {
      ...defaultTranslation,
      name: existing?.name || '',
      shortDescription: existing?.shortDescription || '',
      description: existing?.description || '',
      microStory: existing?.microStory || '',
    };
  });
}

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [grindOptions, setGrindOptions] = useState<GrindOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const coffeeBeanGrindOptions = useMemo(
    () => grindOptions.filter(option => option.isActive && option.code !== 'WHOLE_BEAN'),
    [grindOptions],
  );

  useEffect(() => {
    Promise.all([
      adminFetch<Category[]>('/categories?locale=ar'),
      adminFetch<GrindOption[]>('/grind-options'),
    ])
      .then(([categoryItems, grindItems]) => {
        setCategories(categoryItems);
        setGrindOptions(grindItems);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
      return;
    }

    setLoading(true);
    adminFetch<any>(`/products/${params.id}`)
      .then(product => {
        setForm({
          type: product.type,
          sku: product.sku,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isBestSeller: product.isBestSeller,
          isMaestroPick: product.isMaestroPick,
          isFeatured: product.isFeatured,
          imageUrl: product.imageUrl || '',
          images: (product.images || []).map((img: any) => ({
            id: img.id,
            url: img.url,
            altAr: img.altAr || '',
            altEn: img.altEn || '',
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          })),
          basePreparationTimeMinutes: product.basePreparationTimeMinutes,
          sortOrder: product.sortOrder,
          translations: normalizeTranslations(product.translations),
          variants: product.variants?.length
            ? product.variants.map((variant: any, index: number) => ({
                name: variant.name,
                sizeValue: variant.sizeValue ?? null,
                sizeUnit: variant.sizeUnit || '',
                isActive: variant.isActive ?? true,
                sortOrder: variant.sortOrder ?? index,
                prices: variant.prices?.length
                  ? variant.prices.map((price: any) => ({
                      currencyCode: price.currencyCode,
                      amount: Number(price.amount) || 0,
                    }))
                  : [{ currencyCode: 'SYP', amount: 0 }],
              }))
            : emptyForm.variants,
          grindOptionIds: product.grindOptions?.map((link: any) => link.grindOptionId) || [],
        });
      })
      .catch(err => setError(err instanceof Error ? err.message : 'تعذر تحميل المنتج'))
      .finally(() => setLoading(false));
  }, [isNew, params.id]);

  const updateTranslation = (index: number, patch: Partial<TranslationForm>) => {
    const translations = [...form.translations];
    translations[index] = { ...translations[index], ...patch };
    setForm({ ...form, translations });
  };

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    const variants = [...form.variants];
    variants[index] = { ...variants[index], ...patch };
    setForm({ ...form, variants });
  };

  const updatePrice = (variantIndex: number, priceIndex: number, patch: Partial<PriceForm>) => {
    const variants = [...form.variants];
    const prices = [...variants[variantIndex].prices];
    prices[priceIndex] = { ...prices[priceIndex], ...patch };
    variants[variantIndex] = { ...variants[variantIndex], prices };
    setForm({ ...form, variants });
  };

  const toggleGrindOption = (id: string) => {
    const grindOptionIds = form.grindOptionIds.includes(id)
      ? form.grindOptionIds.filter(optionId => optionId !== id)
      : [...form.grindOptionIds, id];
    setForm({ ...form, grindOptionIds });
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const result = await adminUpload(file, 'products');
      if (!isNew && params.id) {
        await adminFetch(`/admin/products/${params.id}/images`, {
          method: 'POST',
          body: JSON.stringify({ url: result.url }),
        });
        const product = await adminFetch<any>(`/products/${params.id}`);
        setForm(prev => ({
          ...prev,
          images: (product.images || []).map((img: any) => ({
            id: img.id, url: img.url, altAr: img.altAr || '', altEn: img.altEn || '',
            isPrimary: img.isPrimary, sortOrder: img.sortOrder,
          })),
          imageUrl: product.imageUrl || prev.imageUrl,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          images: [...prev.images, { url: result.url, isPrimary: prev.images.length === 0, sortOrder: prev.images.length }],
          imageUrl: prev.images.length === 0 ? result.url : prev.imageUrl,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryImage = async (index: number) => {
    const img = form.images[index];
    if (!img.id) {
      setForm(prev => {
        const images = prev.images.map((i, idx) => ({ ...i, isPrimary: idx === index }));
        return { ...prev, images, imageUrl: prev.images[index].url };
      });
      return;
    }
    try {
      const productId = params.id!;
      await adminFetch(`/admin/products/${productId}/images/${img.id}/primary`, { method: 'PATCH' });
      const product = await adminFetch<any>(`/products/${productId}`);
      setForm(prev => ({
        ...prev,
        images: (product.images || []).map((i: any) => ({
          id: i.id, url: i.url, altAr: i.altAr || '', altEn: i.altEn || '',
          isPrimary: i.isPrimary, sortOrder: i.sortOrder,
        })),
        imageUrl: product.imageUrl || prev.imageUrl,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تعيين الصورة الرئيسية');
    }
  };

  const removeImage = async (index: number) => {
    const img = form.images[index];
    if (!img.id) {
      setForm(prev => {
        const images = prev.images.filter((_, i) => i !== index);
        if (prev.images[index].isPrimary && images.length > 0) images[0].isPrimary = true;
        return { ...prev, images, imageUrl: images.find(i => i.isPrimary)?.url || (images[0]?.url || '') };
      });
      return;
    }
    try {
      const productId = params.id!;
      await adminFetch(`/admin/products/${productId}/images/${img.id}`, { method: 'DELETE' });
      const product = await adminFetch<any>(`/products/${productId}`);
      setForm(prev => ({
        ...prev,
        images: (product.images || []).map((i: any) => ({
          id: i.id, url: i.url, altAr: i.altAr || '', altEn: i.altEn || '',
          isPrimary: i.isPrimary, sortOrder: i.sortOrder,
        })),
        imageUrl: product.imageUrl || prev.imageUrl,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الصورة');
    }
  };

  const save = async () => {
    setError(null);
    if (!form.categoryId) {
      setError('اختر تصنيف المنتج أولاً');
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...form,
        imageUrl: form.imageUrl || undefined,
        grindOptionIds: form.type === 'COFFEE_BEAN' ? form.grindOptionIds : [],
        variants: form.variants.map(variant => ({
          ...variant,
          sizeValue: variant.sizeValue || undefined,
          sizeUnit: variant.sizeUnit || undefined,
          prices: variant.prices.map(price => ({
            currencyCode: price.currencyCode.toUpperCase(),
            amount: Number(price.amount) || 0,
          })),
        })),
      };

      if (isNew) {
        await adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(body) });
      } else {
        await adminFetch(`/admin/products/${params.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      router.push('/dashboard/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ المنتج');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>جاري تحميل المنتج...</div>;
  }

  return (
    <div dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
            {isNew ? 'إضافة منتج جديد' : 'تعديل المنتج'}
          </h1>
          <p style={{ color: 'var(--br-muted)', fontSize: 14 }}>بيانات الكتالوج والأسعار وخيارات البن.</p>
        </div>
        <button onClick={() => router.push('/dashboard/products')} className="btn" style={{ background: 'var(--br-cream)' }}>
          رجوع
        </button>
      </div>

      {error && <div className="card" style={{ color: 'var(--br-danger)', marginBottom: 16, padding: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 20, marginBottom: 80 }}>
        {/* Section 1: Basic Info */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--br-gold-dark)' }}>معلومات المنتج</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 16 }}>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              SKU
              <input className="input" style={{ marginTop: 6 }} value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              النوع
              <select className="input" style={{ marginTop: 6 }} value={form.type} onChange={event => setForm({ ...form, type: event.target.value as ProductType, grindOptionIds: event.target.value === 'COFFEE_BEAN' ? form.grindOptionIds : [] })}>
                {productTypes.map(productType => (
                  <option key={productType} value={productType}>{productTypeLabels[productType]}</option>
                ))}
              </select>
            </label>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              التصنيف
              <select className="input" style={{ marginTop: 6 }} value={form.categoryId} onChange={event => setForm({ ...form, categoryId: event.target.value })}>
                <option value="">اختر تصنيفاً</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{localizedName(category.translations, category.slug)}</option>
                ))}
              </select>
            </label>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              وقت التجهيز (دقائق)
              <input className="input" style={{ marginTop: 6 }} type="number" value={form.basePreparationTimeMinutes} onChange={event => setForm({ ...form, basePreparationTimeMinutes: Number(event.target.value) || 15 })} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 14 }}>
              الترتيب
              <input className="input" style={{ marginTop: 6 }} type="number" value={form.sortOrder} onChange={event => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
            {[
              ['isActive', 'نشط'],
              ['isBestSeller', 'الأكثر طلباً'],
              ['isMaestroPick', 'اختيار المايسترو'],
              ['isFeatured', 'مميز'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                <input type="checkbox" checked={Boolean(form[key as keyof ProductForm])} onChange={event => setForm({ ...form, [key]: event.target.checked })} />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* Section 2: Product Images */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: 'var(--br-gold-dark)' }}>صور المنتج</h2>
          <p style={{ color: 'var(--br-muted)', fontSize: 13, marginBottom: 16 }}>يفضل صورة مربعة أو بنسبة 4:3 وبخلفية نظيفة. الصورة الأولى تصبح الرئيسية.</p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-start' }}>
            {form.images.map((img, index) => (
              <div key={index} style={{ position: 'relative', width: 120, borderRadius: 8, overflow: 'hidden', border: img.isPrimary ? '3px solid var(--br-gold)' : '1px solid var(--br-line)' }}>
                <img src={img.url} alt="" style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }} />
                {img.isPrimary && <span style={{ position: 'absolute', top: 4, right: 4, background: 'var(--br-gold)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>أساسية</span>}
                <div style={{ display: 'flex', gap: 4, padding: 4 }}>
                  {!img.isPrimary && <button className="btn btn-sm" style={{ flex: 1, fontSize: 11, padding: '3px 0', background: 'var(--br-cream)' }} onClick={() => setPrimaryImage(index)}>رئيسية</button>}
                  <button className="btn btn-sm" style={{ flex: 1, fontSize: 11, padding: '3px 0', background: '#fee' }} onClick={() => removeImage(index)}>حذف</button>
                </div>
              </div>
            ))}
            <label className="btn btn-primary" style={{ width: 120, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, gap: 6, fontSize: 13 }}>
              {uploading ? 'جاري الرفع...' : (
                <>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>+</span>
                  <span>تحميل صورة</span>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={async event => { const file = event.target.files?.[0]; if (file) await handleUploadImage(file); event.target.value = ''; }} />
            </label>
          </div>
        </section>

        {/* Section 3: Translations */}
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--br-gold-dark)' }}>الترجمات والقصة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 16 }}>
            {form.translations.map((translation, index) => (
              <div key={translation.locale} style={{ background: 'var(--br-cream)', borderRadius: 8, padding: 16 }}>
                <h3 style={{ fontSize: 16, color: 'var(--br-gold)', marginBottom: 12 }}>
                  {translation.locale === 'ar' ? 'العربية' : 'English'}
                </h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input className="input" placeholder="الاسم" value={translation.name} onChange={event => updateTranslation(index, { name: event.target.value })} />
                  <input className="input" placeholder="وصف قصير" value={translation.shortDescription} onChange={event => updateTranslation(index, { shortDescription: event.target.value })} />
                  <textarea className="input" rows={3} placeholder="الوصف" value={translation.description} onChange={event => updateTranslation(index, { description: event.target.value })} />
                  <textarea className="input" rows={2} placeholder="Micro story" value={translation.microStory} onChange={event => updateTranslation(index, { microStory: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>الأحجام والأسعار</h2>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--br-cream)' }}
              onClick={() => setForm({
                ...form,
                variants: [
                  ...form.variants,
                  { name: 'Regular', sizeValue: null, sizeUnit: '', isActive: true, sortOrder: form.variants.length, prices: [{ currencyCode: 'SYP', amount: 0 }] },
                ],
              })}
            >
              إضافة خيار
            </button>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {form.variants.map((variant, variantIndex) => (
              <div key={variantIndex} style={{ background: '#fafafa', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(130px, 1fr))', gap: 12 }}>
                  <input className="input" placeholder="اسم الخيار" value={variant.name} onChange={event => updateVariant(variantIndex, { name: event.target.value })} />
                  <input className="input" type="number" placeholder="الحجم" value={variant.sizeValue ?? ''} onChange={event => updateVariant(variantIndex, { sizeValue: event.target.value ? Number(event.target.value) : null })} />
                  <input className="input" placeholder="الوحدة" value={variant.sizeUnit} onChange={event => updateVariant(variantIndex, { sizeUnit: event.target.value })} />
                  <input className="input" type="number" placeholder="الترتيب" value={variant.sortOrder} onChange={event => updateVariant(variantIndex, { sortOrder: Number(event.target.value) || 0 })} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                    <input type="checkbox" checked={variant.isActive} onChange={event => updateVariant(variantIndex, { isActive: event.target.checked })} />
                    نشط
                  </label>
                </div>

                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                  {variant.prices.map((price, priceIndex) => (
                    <div key={priceIndex} style={{ display: 'grid', gridTemplateColumns: '140px minmax(160px, 1fr) auto', gap: 10 }}>
                      <input className="input" value={price.currencyCode} onChange={event => updatePrice(variantIndex, priceIndex, { currencyCode: event.target.value })} />
                      <input className="input" type="number" value={price.amount} onChange={event => updatePrice(variantIndex, priceIndex, { amount: Number(event.target.value) || 0 })} />
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--br-cream)' }}
                        onClick={() => {
                          const prices = variant.prices.filter((_, index) => index !== priceIndex);
                          updateVariant(variantIndex, { prices: prices.length ? prices : [{ currencyCode: 'SYP', amount: 0 }] });
                        }}
                      >
                        حذف السعر
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--br-cream)', width: 'fit-content' }}
                    onClick={() => updateVariant(variantIndex, { prices: [...variant.prices, { currencyCode: 'SYP', amount: 0 }] })}
                  >
                    إضافة سعر
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {form.type === 'COFFEE_BEAN' && (
          <section className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--br-gold-dark)' }}>خيارات الطحن المتاحة</h2>
            <p style={{ color: 'var(--br-muted)', fontSize: 13, marginBottom: 16 }}>
              خيار Whole Bean يختاره العميل من نوع البن، أما الطرق التالية فهي للبن المطحون فقط.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {coffeeBeanGrindOptions.map(option => {
                const selected = form.grindOptionIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleGrindOption(option.id)}
                    className="btn"
                    style={{
                      justifyContent: 'space-between',
                      background: selected ? 'var(--br-gold)' : 'var(--br-cream)',
                      color: selected ? 'var(--br-black)' : 'var(--br-coffee)',
                    }}
                  >
                    <span>{option.nameAr}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{option.code}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Save Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255, 250, 240, 0.96)', borderTop: '1px solid var(--br-line)',
        padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end',
        backdropFilter: 'blur(8px)',
      }}>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ minWidth: 120 }}>
          {saving ? 'جاري الحفظ...' : isNew ? 'إضافة المنتج' : 'حفظ التغييرات'}
        </button>
        <button onClick={() => router.push('/dashboard/products')} className="btn" style={{ background: 'var(--br-cream)' }}>
          إلغاء
        </button>
        {!isNew && (
          <button onClick={() => window.open(`http://localhost:3000/ar/products/${params.id}`, '_blank')} className="btn btn-outline" style={{ marginInlineEnd: 'auto' }}>
            معاينة
          </button>
        )}
      </div>
    </div>
  );
}
