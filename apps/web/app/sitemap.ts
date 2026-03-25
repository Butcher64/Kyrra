import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://kyrra.io', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://kyrra.io/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://kyrra.io/legal/cgu', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://kyrra.io/legal/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
