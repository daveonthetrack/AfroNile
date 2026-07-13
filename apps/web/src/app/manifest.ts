import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfroNile Artist Platform',
    short_name: 'AfroNile',
    description: 'Access exclusive music, cryptographic digital tickets, and merchandise directly from AfroNile.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0a08', // matching our new warm espresso background
    theme_color: '#d95f30',      // matching our terracotta primary brand color
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
