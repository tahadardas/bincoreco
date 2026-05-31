'use client';
import { useState, useRef } from 'react';
import { adminUpload } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';

type MediaUploadProps = {
  folder?: 'products' | 'banners' | 'brand' | 'general';
  onUploaded: (url: string) => void;
  accept?: string;
  label?: string;
};

export default function MediaUpload({ folder = 'products', onUploaded, accept = 'image/jpeg,image/png,image/webp,image/svg+xml', label }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('الملف كبير جدًا. الحد الأقصى 3 ميغابايت');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await adminUpload(file, folder);
      onUploaded(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الملف');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 8,
          background: uploading ? 'var(--br-cream)' : 'var(--br-gold)',
          color: uploading ? 'var(--br-muted)' : 'var(--br-black)',
          fontWeight: 600, fontSize: 14, cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {uploading ? 'جاري الرفع...' : (label || 'رفع صورة')}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          disabled={uploading}
          onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFile(f); }}
        />
      </label>
      {error && <div style={{ color: 'var(--br-danger)', fontSize: 13, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
