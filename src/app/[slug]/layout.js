// SERVER COMPONENT — enables generateMetadata + JSON-LD for SEO
import { createClient } from '@supabase/supabase-js';
import SlugNav from './SlugNav';

async function getKitchen(slug) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase.from('kitchens').select('*').eq('slug', slug).single();
    return data;
  } catch { return null; }
}

/** Dynamic per-kitchen SEO metadata */
export async function generateMetadata({ params }) {
  const k = await getKitchen(params.slug);
  if (!k) return { title: 'Kitchen Not Found' };

  const title       = `${k.name} | Party Catering & Bulk Food Orders`;
  const description = `${k.tagline || `Order from ${k.name}`}. Fresh bulk food catering for parties, events and corporate gatherings. Min 10 people.`;
  const images      = k.logo_url ? [{ url: k.logo_url, width: 800, height: 600, alt: k.name }] : [];

  return {
    title,
    description,
    keywords: [k.name, 'party catering', 'bulk food order', 'cloud kitchen', 'event catering', 'food delivery near me'],
    openGraph: { title, description, images, type: 'website', siteName: k.name },
    twitter:   { card: 'summary_large_image', title, description, images: k.logo_url ? [k.logo_url] : [] },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${params.slug}` },
  };
}

export default async function SlugLayout({ children, params }) {
  const kitchen = await getKitchen(params.slug);

  // JSON-LD Restaurant structured data — improves Google rich results
  const jsonLd = kitchen ? {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: kitchen.name,
    description: kitchen.tagline,
    image: kitchen.logo_url,
    telephone: kitchen.phone,
    servesCuisine: 'Indian',
    priceRange: '₹₹',
    menu: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${params.slug}`,
    acceptsReservations: false,
    address: kitchen.address
      ? { '@type': 'PostalAddress', streetAddress: kitchen.address }
      : undefined,
    potentialAction: {
      '@type': 'OrderAction',
      target: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${params.slug}`,
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SlugNav slug={params.slug} kitchenName={kitchen?.name} logoUrl={kitchen?.logo_url} />
      <main>{children}</main>
    </>
  );
}
