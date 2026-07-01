import { createClient } from '@supabase/supabase-js';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export default async function sitemap() {
  let kitchenRoutes = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: kitchens } = await supabase
      .from('kitchens').select('slug').eq('active', true);

    if (kitchens) {
      kitchenRoutes = kitchens.map((k) => ({
        url: `${BASE}/${k.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      }));
    }
  } catch {}

  return [
    { url: BASE,           lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.1 },
    ...kitchenRoutes,
  ];
}
