'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { getDictionary, Locale } from '@/lib/dictionaries';
import { resolveMediaUrl } from '@/lib/media';
import EspressoButton from '@/components/espresso-button';
import { useAuth } from '@/lib/auth-context';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  userName: string | null;
  guestName: string | null;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingsBreakdown: { rating: number; count: number }[];
}

interface ProductReviewsProps {
  productId: string;
}

type SortMode = 'latest' | 'highest' | 'lowest';

function StarIcon({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'var(--br-gold)' : 'none'}
      stroke="var(--br-gold)"
      strokeWidth="1.5"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function StarsRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon key={star} filled={star <= Math.round(rating)} size={size} />
      ))}
    </span>
  );
}

function formatDate(dateStr: string, locale: Locale) {
  const date = new Date(dateStr);
  try {
    return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const params = useParams();
  const locale = (params.locale as Locale) || 'ar';
  const dict = getDictionary(locale);
  const { user, token } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingsBreakdown, setRatingsBreakdown] = useState<{ rating: number; count: number }[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formGuestName, setFormGuestName] = useState('');
  const [formGuestPhone, setFormGuestPhone] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ReviewsResponse>(`/products/${productId}/reviews`);
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      setTotalReviews(data.totalReviews);
      setRatingsBreakdown(data.ratingsBreakdown || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortMode === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortMode === 'highest') return b.rating - a.rating;
    return a.rating - b.rating;
  });

  const handleSubmit = async () => {
    if (formRating === 0) {
      setError(dict.review.ratingRequired);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { rating: formRating };
      if (formTitle.trim()) body.title = formTitle.trim();
      if (formComment.trim()) body.comment = formComment.trim();
      if (!user) {
        body.guestName = formGuestName.trim();
        body.guestPhone = formGuestPhone.trim();
      }
      await api.post(`/products/${productId}/reviews`, body, token);
      setSuccess(true);
      setFormRating(0);
      setFormTitle('');
      setFormComment('');
      setFormGuestName('');
      setFormGuestPhone('');
      await fetchReviews();
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const breakdownMap = new Map(ratingsBreakdown.map(item => [item.rating, item.count]));
  const breakdownRows = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: breakdownMap.get(star) || 0,
    pct: totalReviews > 0 ? ((breakdownMap.get(star) || 0) / totalReviews) * 100 : 0,
  }));

  return (
    <div className="card" style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>
        {dict.review.title}
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--br-muted)' }}>
          {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--br-gold-dark)', lineHeight: 1 }}>
              {averageRating.toFixed(1)}
            </div>
            <div>
              <StarsRow rating={averageRating} size={28} />
              <div style={{ color: 'var(--br-muted)', fontSize: 14, marginTop: 4 }}>
                {totalReviews} {dict.review.totalReviews}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {breakdownRows.map(item => (
              <div key={item.star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 30, color: 'var(--br-coffee)', textAlign: 'center' }}>
                  {item.star}
                </span>
                <div className="meter" style={{ flex: 1, height: 10 }}>
                  <span style={{ width: `${item.pct}%` }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--br-muted)', minWidth: 28, textAlign: 'center' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select
              className="select"
              style={{ width: 'auto', minWidth: 140 }}
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
            >
              <option value="latest">{dict.review.sortLatest}</option>
              <option value="highest">{dict.review.sortHighest}</option>
              <option value="lowest">{dict.review.sortLowest}</option>
            </select>
            <EspressoButton size="small" onClick={() => setShowForm(!showForm)} tone="gold">
              {showForm ? (locale === 'ar' ? 'إلغاء' : 'Cancel') : dict.review.addReview}
            </EspressoButton>
          </div>

          {showForm && (
            <div
              className="card"
              style={{
                padding: 20,
                marginBottom: 24,
                background: 'rgba(201,150,26,0.06)',
                border: '1px solid rgba(201,150,26,0.2)',
              }}
            >
              {success ? (
                <div style={{ color: 'var(--br-success)', fontWeight: 700, fontSize: 15, textAlign: 'center', padding: 12 }}>
                  {dict.review.thankYou}
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 14 }}>
                    {user ? dict.review.yourReview : dict.review.addReview}
                  </h3>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontWeight: 700, display: 'block', marginBottom: 6, fontSize: 14 }}>
                      {dict.review.yourRating}
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: 'none',
                            padding: 2,
                            cursor: 'pointer',
                            transition: 'transform 0.15s',
                            lineHeight: 1,
                            transform: star <= (hoverRating || formRating) ? 'scale(1.15)' : 'scale(1)',
                          }}
                        >
                          <svg
                            width={32}
                            height={32}
                            viewBox="0 0 24 24"
                            fill={star <= (hoverRating || formRating) ? 'var(--br-gold)' : 'none'}
                            stroke="var(--br-gold)"
                            strokeWidth="1.5"
                            style={{
                              display: 'block',
                              transition: 'fill 0.15s, transform 0.15s',
                              filter: star <= (hoverRating || formRating) ? 'drop-shadow(0 0 4px rgba(201,150,26,0.5))' : 'none',
                            }}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <input
                      className="input"
                      placeholder={dict.review.titleOptional}
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder={dict.review.commentOptional}
                      value={formComment}
                      onChange={e => setFormComment(e.target.value)}
                    />
                  </div>

                  {!user && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 13, color: 'var(--br-muted)', marginBottom: 10, fontWeight: 700 }}>
                        {dict.review.guestInfo}
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <input
                          className="input"
                          style={{ flex: 1, minWidth: 140 }}
                          placeholder={dict.review.guestName}
                          value={formGuestName}
                          onChange={e => setFormGuestName(e.target.value)}
                        />
                        <input
                          className="input"
                          style={{ flex: 1, minWidth: 140 }}
                          placeholder={dict.review.guestPhone}
                          value={formGuestPhone}
                          onChange={e => setFormGuestPhone(e.target.value)}
                        />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--br-muted)', marginTop: 8 }}>
                        {dict.review.reviewPending}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div style={{ color: 'var(--br-danger)', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                      {error}
                    </div>
                  )}

                  <EspressoButton onClick={handleSubmit} loading={submitting} size="small" disabled={formRating === 0}>
                    {dict.review.submit}
                  </EspressoButton>
                </>
              )}
            </div>
          )}

          {sortedReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--br-muted)' }}>
              {dict.review.noReviews}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {sortedReviews.map(review => {
                const reviewerName = review.userName || review.guestName || (locale === 'ar' ? 'مستخدم' : 'User');
                return (
                  <div
                    key={review.id}
                    style={{
                      padding: 18,
                      borderRadius: 8,
                      background: 'var(--br-white)',
                      border: '1px solid var(--br-line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>{reviewerName}</strong>
                        {review.isVerifiedPurchase && (
                          <span className="badge badge-success" style={{ marginInlineStart: 8 }}>
                            {dict.review.verifiedPurchase}
                          </span>
                        )}
                      </div>
                      <StarsRow rating={review.rating} size={14} />
                    </div>

                    {review.title && (
                      <h4 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                        {review.title}
                      </h4>
                    )}

                    {review.comment && (
                      <p style={{ color: 'var(--br-muted)', fontSize: 14, marginBottom: 8 }}>
                        {review.comment}
                      </p>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--br-muted)' }}>
                      {formatDate(review.createdAt, locale)}
                    </div>

                    {review.adminReply && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(201,150,26,0.08)',
                          border: '1px solid rgba(201,150,26,0.15)',
                          fontSize: 14,
                        }}
                      >
                        <strong style={{ color: 'var(--br-gold-dark)' }}>
                          {locale === 'ar' ? 'رد الإدارة:' : 'Admin Reply:'}
                        </strong>
                        <p style={{ color: 'var(--br-coffee)', marginTop: 4 }}>
                          {review.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
