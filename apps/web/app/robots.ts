import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/settings', '/emails', '/connect-gmail', '/onboarding-progress', '/admin', '/api/'],
      },
    ],
    sitemap: 'https://kyrra.io/sitemap.xml',
  }
}
