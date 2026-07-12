import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://afronile.com';

  const routes = [
    '',
    '/artist',
    '/music',
    '/tour',
    '/shop',
    '/news'
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/news' || route === '/tour' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/tour' || route === '/shop' ? 0.9 : 0.8,
  }));
}
