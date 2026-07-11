'use client';

import { useRef, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function ImageUpload({ bucket, onUpload, currentUrl, label = 'Upload Image', stableKey }) {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(currentUrl || '');
  const inputRef = useRef();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }

    // Local preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const supabase  = getSupabase();
    const ext       = file.name.split('.').pop();
    // Use stable key if provided (prevents duplicate files in storage)
    // e.g. stableKey="kitchen_abc123_logo" → always overwrites same file
    const filename  = stableKey ? `${stableKey}.${ext}` : `${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true });
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
    onUpload(publicUrl);
    setUploading(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      {preview && (
        <img src={preview} alt="Preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '2px solid #eee' }} />
      )}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '2px solid var(--primary)',
            background: '#fff5f0', color: 'var(--primary)', fontWeight: 700,
            cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem'
          }}
        >
          {uploading ? '⏳ Uploading…' : `📷 ${label}`}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>PNG/JPG, max 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}
