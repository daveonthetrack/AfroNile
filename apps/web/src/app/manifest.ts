import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfroNile Artist Platform',
    short_name: 'AfroNile',
    description: 'Access exclusive music, cryptographic digital tickets, and merchandise directly from AfroNile.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b', // matching our globals zinc-950 background
    theme_color: '#d97706',      // matching our amber-600 primary brand color
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
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
