'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { contactFormSchema } from '@/lib/forms';
import EspressoButton from '@/components/espresso-button';
import { RevealSection } from '@/components/scroll-reveal';

const contentFields = [
    'contact_phone', 'contact_whatsapp', 'contact_email',
    'contact_address', 'contact_hours', 'contact_instagram', 'contact_facebook',
    'contact_map_embed_url', 'contact_map_link',
    'contact_hero_title', 'contact_hero_sub',
    'contact_form_title', 'contact_map_title',
    'contact_success_msg',
    'contact_cta_order', 'contact_cta_whatsapp',
  ] as const;

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading">
      <div>
        <div className="section-eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);

  const { register, handleSubmit: handleRHFSubmit, formState: { errors, isSubmitting }, reset: resetForm } = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [contactVals, setContactVals] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<Record<string, string | null>>('/settings/public-content').then((data) => {
      if (!data) return;
      const newVals: Record<string, string> = {};
      for (const key of contentFields as unknown as string[]) {
        const val = data[key];
        if (val) newVals[key] = val;
      }
      for (const key of contentFields as unknown as string[]) {
        const arVal = data[`${key}_ar`];
        if (arVal) newVals[`${key}_ar`] = arVal;
        const enVal = data[`${key}_en`];
        if (enVal) newVals[`${key}_en`] = enVal;
      }
      setContactVals(newVals);
    }).catch(() => {});
  }, []);

  const onFormSubmit = async (data: z.infer<typeof contactFormSchema>) => {
    setError('');
    setSending(true);
    try {
      await api.post('/contact-messages', data);
      setSent(true);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const infoCards = [
    { label: dict.contact.phone, icon: '📞', value: contactVals.contact_phone || '' },
    { label: dict.contact.whatsapp, icon: '💬', value: contactVals.contact_whatsapp || '' },
    { label: dict.contact.emailLabel, icon: '📧', value: contactVals.contact_email || '' },
    { label: dict.contact.address, icon: '📍', value: contactVals[`contact_address_${locale}`] || contactVals.contact_address || '' },
    { label: dict.contact.hours, icon: '🕒', value: contactVals[`contact_hours_${locale}`] || contactVals.contact_hours || '' },
    { label: dict.contact.instagram, icon: '📷', value: contactVals.contact_instagram || '' },
  ];

  return (
    <div className="page-shell" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero */}
      <section className="bg-hero-dark" style={{
        position: 'relative',
        overflow: 'hidden',
        color: 'var(--br-white)',
        padding: '82px 0 58px',
        marginTop: -34,
      }}>
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div className="section-eyebrow" style={{ color: 'var(--br-gold-light)', marginBottom: 12 }}>
            {dict.nav.contact}
          </div>
          <h1 style={{ fontSize: 48, lineHeight: 1.1, fontWeight: 900, color: 'var(--br-gold-light)', marginBottom: 14 }}>
            {contactVals[`contact_hero_title_${locale}`] || dict.contact.heroTitle}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,250,240,0.82)', maxWidth: 540, margin: '0 auto' }}>
            {contactVals[`contact_hero_sub_${locale}`] || dict.contact.heroSub}
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <RevealSection>
        <section className="page-shell">
          <div className="container">
            <SectionHeader eyebrow={dict.nav.contact} title={contactVals[`contact_hero_title_${locale}`] || dict.contact.heroTitle} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}>
              {infoCards.map((card, i) => (
                <div key={i} className="card" style={{ padding: 22, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                  <div className="section-eyebrow" style={{ marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Contact Form */}
      <RevealSection>
        <section style={{ padding: '0 0 64px' }}>
          <div className="container" style={{ maxWidth: 640 }}>
            {sent ? (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: 'var(--br-success)' }}>
                  {contactVals[`contact_success_msg_${locale}`] || dict.contact.successMsg}
                </h3>
                <EspressoButton onClick={() => setSent(false)} tone="outline" size="small">
                  {contactVals[`contact_form_title_${locale}`] || dict.contact.formTitle}
                </EspressoButton>
              </div>
            ) : (
              <form onSubmit={handleRHFSubmit(onFormSubmit)} style={{ display: 'grid', gap: 16 }}>
                <SectionHeader eyebrow={dict.nav.contact} title={contactVals[`contact_form_title_${locale}`] || dict.contact.formTitle} />

                {error && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(180, 35, 24, 0.1)',
                    border: '1px solid rgba(180, 35, 24, 0.3)',
                    borderRadius: 8,
                    color: 'var(--br-danger)',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    {error}
                  </div>
                )}

                <div>
                  <input className="input" placeholder={dict.contact.fullName} {...register('fullName')} />
                  {errors.fullName && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 4 }}>{errors.fullName.message}</div>}
                </div>
                <div>
                  <input className="input" placeholder={dict.contact.phoneLabel} {...register('phone')} />
                  {errors.phone && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 4 }}>{errors.phone.message}</div>}
                </div>
                <div>
                  <input className="input" placeholder={dict.contact.emailLabel} {...register('email')} />
                  {errors.email && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 4 }}>{errors.email.message}</div>}
                </div>
                <div>
                  <input className="input" placeholder={dict.contact.subject} {...register('subject')} />
                </div>
                <div>
                  <textarea
                    className="input"
                    style={{ minHeight: 120, resize: 'vertical' }}
                    placeholder={dict.contact.message}
                    {...register('message')}
                    maxLength={2000}
                  />
                  {errors.message && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 4 }}>{errors.message.message}</div>}
                </div>
                <EspressoButton type="submit" loading={isSubmitting || sending} size="large">
                  {dict.contact.submit}
                </EspressoButton>
              </form>
            )}
          </div>
        </section>
      </RevealSection>

      {/* Map Section */}
      <RevealSection>
        <section style={{ padding: '0 0 64px' }}>
          <div className="container">
            <SectionHeader eyebrow={dict.nav.contact} title={contactVals[`contact_map_title_${locale}`] || dict.contact.mapPlaceholder} />
            <div className="card" style={{ overflow: 'hidden' }}>
              {contactVals.contact_map_embed_url ? (
                <div style={{ width: '100%', aspectRatio: '16 / 7', minHeight: 280 }}>
                  <iframe
                    src={contactVals.contact_map_embed_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: 280 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={contactVals[`contact_map_title_${locale}`] || dict.contact.mapPlaceholder}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '16 / 7', minHeight: 280,
                  background: 'var(--br-espresso)',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--br-gold-light)', fontWeight: 700,
                }}>
                  {locale === 'ar' ? 'لم يتم ضبط الخريطة بعد' : 'Map not configured yet'}
                </div>
              )}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* CTA Buttons */}
      <RevealSection>
        <section className="dark-section" style={{
          padding: '60px 0',
          background: 'var(--br-espresso)',
          color: 'var(--br-white)',
          textAlign: 'center',
        }}>
          <div className="container" style={{ display: 'grid', gap: 20, justifyItems: 'center' }}>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--br-gold-light)' }}>
              {contactVals[`contact_hero_title_${locale}`] || dict.contact.heroTitle}
            </h2>
            <p style={{ color: 'rgba(255,250,240,0.78)', maxWidth: 500 }}>
              {contactVals[`contact_hero_sub_${locale}`] || dict.contact.heroSub}
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <EspressoButton size="large" onClick={() => router.push(`/${locale}/products`)}>
                {contactVals[`contact_cta_order_${locale}`] || dict.contact.ctaOrder}
              </EspressoButton>
              <EspressoButton tone="outline" size="large" onClick={() => window.open(`https://wa.me/${(contactVals.contact_whatsapp || '').replace(/[^0-9]/g, '')}`, '_blank')}>
                {contactVals[`contact_cta_whatsapp_${locale}`] || dict.contact.ctaWhatsapp}
              </EspressoButton>
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
