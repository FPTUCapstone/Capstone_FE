import type { NextConfig } from 'next';
import { getApiProxyRewrites } from './src/lib/server/apiProxyRewrites';

const nextConfig: NextConfig = {
  // Cloudflare Quick Tunnel is used only for local PayOS callback verification.
  // Keeping the host in an environment variable avoids committing an ephemeral URL.
  allowedDevOrigins: process.env.NEXT_ALLOWED_DEV_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Proxy unmatched /api/v1/* requests to the backend so browser auth calls are same-origin.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: getApiProxyRewrites(process.env.TRIPMATE_API_BASE_URL) };
  },
};

export default nextConfig;
