'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { contactFormSchema } from '@/lib/forms';
import EspressoButton from '@/components/espresso-button';
import { RevealSection } from '@/components/scroll-reveal';

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const initialForm: FormState = { fullName: '', phone: '', email: '', subject: '', message: '' };

const defaults = {
  contact_phone: '+963 11 234 5678',
  contact_whatsapp: '+963 933 123 456',
  contact_address: 'Damascus, Al-Mazzeh, Syria',
  contact_hours: 'Sat–Thu: 8:00 AM – 11:00 PM',
  contact_instagram: '@banco.ricco',
  contact_hero_title_ar: '',
  contact_hero_title_en: '',
  contact_hero_sub_ar: '',
  contact_hero_sub_en: '',
  contact_form_title_ar: '',
  contact_form_title_en: '',
  contact_map_title_ar: '',
  contact_map_title_en: '',
  contact_success_msg_ar: '',
  contact_success_msg_en: '',
  contact_cta_order_ar: '',
  contact_cta_order_en: '',
  contact_cta_whatsapp_ar: '',
  contact_cta_whatsapp_en: '',
};

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
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const [form, setForm] = useState<FormState>(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [contactVals, setContactVals] = useState(defaults);

  useEffect(() => {
    api.get<Record<string, string | null>>('/settings/public-brand').then((data) => {
      setContactVals(prev => ({
        ...prev,
        contact_phone: data.contact_phone || defaults.contact_phone,
        contact_whatsapp: data.contact_whatsapp || defaults.contact_whatsapp,
        contact_address: data.contact_address || defaults.contact_address,
        contact_hours: data.contact_hours || defaults.contact_hours,
        contact_instagram: data.contact_instagram || defaults.contact_instagram,
        contact_hero_title_ar: data.contact_hero_title_ar || '',
        contact_hero_title_en: data.contact_hero_title_en || '',
        contact_hero_sub_ar: data.contact_hero_sub_ar || '',
        contact_hero_sub_en: data.contact_hero_sub_en || '',
        contact_form_title_ar: data.contact_form_title_ar || '',
        contact_form_title_en: data.contact_form_title_en || '',
        contact_map_title_ar: data.contact_map_title_ar || '',
        contact_map_title_en: data.contact_map_title_en || '',
        contact_success_msg_ar: data.contact_success_msg_ar || '',
        contact_success_msg_en: data.contact_success_msg_en || '',
        contact_cta_order_ar: data.contact_cta_order_ar || '',
        contact_cta_order_en: data.contact_cta_order_en || '',
        contact_cta_whatsapp_ar: data.contact_cta_whatsapp_ar || '',
        contact_cta_whatsapp_en: data.contact_cta_whatsapp_en || '',
      }));
    }).catch(() => {});
  }, []);

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const validate = (): string | null => {
    if (!form.fullName.trim()) return dict.contact.fullName + ' ' + 'required';
    if (!form.phone.trim()) return dict.contact.phoneLabel + ' ' + 'required';
    if (!form.message.trim()) return dict.contact.message + ' ' + 'required';
    if (form.message.trim().length > 2000) return dict.contact.message + ' max 2000';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSending(true);
    try {
      await api.post('/contact-messages', form);
      setSent(true);
      setForm(initialForm);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const infoCards = [
    { label: dict.contact.phone, icon: '📞', value: contactVals.contact_phone },
    { label: dict.contact.whatsapp, icon: '💬', value: contactVals.contact_whatsapp },
    { label: dict.contact.address, icon: '📍', value: contactVals.contact_address },
    { label: dict.contact.hours, icon: '🕒', value: contactVals.contact_hours },
    { label: dict.contact.instagram, icon: '📷', value: contactVals.contact_instagram },
  ];

  return (
    <div className="page-shell" dir={dir}>
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
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
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

                <input className="input" placeholder={dict.contact.fullName} value={form.fullName} onChange={update('fullName')} />
                <input className="input" placeholder={dict.contact.phoneLabel} value={form.phone} onChange={update('phone')} />
                <input className="input" placeholder={dict.contact.emailLabel} value={form.email} onChange={update('email')} />
                <input className="input" placeholder={dict.contact.subject} value={form.subject} onChange={update('subject')} />
                <textarea
                  className="input"
                  style={{ minHeight: 120, resize: 'vertical' }}
                  placeholder={dict.contact.message}
                  value={form.message}
                  onChange={update('message')}
                  maxLength={2000}
                />
                <div style={{ textAlign: 'end', fontSize: 12, color: 'var(--br-muted)' }}>
                  {form.message.length}/2000
                </div>
                <EspressoButton type="submit" loading={sending} size="large">
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
              <div style={{
                width: '100%',
                aspectRatio: '16 / 7',
                minHeight: 280,
                background: 'var(--br-espresso)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--br-gold-light)',
                fontWeight: 700,
              }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2133.614!2d36.2765!3d33.5131!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDMwJzQ3LjIiTiAzNsKwMTYnMzUuNSJF!5e0!3m2!1sen!2s!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 280 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={contactVals[`contact_map_title_${locale}`] || dict.contact.mapPlaceholder}
                />
              </div>
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
              <EspressoButton tone="outline" size="large" onClick={() => window.open(`https://wa.me/${contactVals.contact_whatsapp.replace(/[^0-9]/g, '')}`, '_blank')}>
                {contactVals[`contact_cta_whatsapp_${locale}`] || dict.contact.ctaWhatsapp}
              </EspressoButton>
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
