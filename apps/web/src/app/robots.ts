import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',            // Private transaction APIs
        '/admin/',          // Admin control dashboards
        '/verify/',         // Private staff gate-check dashboard
      ],
    },
    sitemap: 'https://afronile.com/sitemap.xml',
  };
}
