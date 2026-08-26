import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IncassaSaaS',
    short_name: 'Incassa',
    description: 'Hai lavorato. Ora fatti pagare.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a3322', // Adjust this based on your branding
    theme_color: '#1a3322',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
