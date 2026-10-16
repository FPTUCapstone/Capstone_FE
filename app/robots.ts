import type { MetadataRoute } from 'next';

/**
 * Tripadvisor (Terra) review text is loaded in the browser through `/api/v1/pois/{id}/external-reviews`
 * (proxied by next.config.ts on deployed hosts); the licence requires crawlers to stay away from it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/v1/pois/*/external-reviews'],
    },
  };
}
