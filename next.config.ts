import type { NextConfig } from 'next';
import { getApiProxyRewrites } from './src/lib/server/apiProxyRewrites';

const nextConfig: NextConfig = {
  // Proxy unmatched /api/v1/* requests to the backend so browser auth calls are same-origin.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: getApiProxyRewrites(process.env.TRIPMATE_API_BASE_URL) };
  },
};

export default nextConfig;
