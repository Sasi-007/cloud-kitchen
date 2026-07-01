const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/superadmin/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
