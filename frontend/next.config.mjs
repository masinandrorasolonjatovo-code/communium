/** @type {import('next').NextConfig} */
import fs from 'node:fs';
import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

function loadWorkspaceEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key]) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadWorkspaceEnvFile(path.resolve(process.cwd(), '..', '.env.local'));

const withNextIntl = createNextIntlPlugin();
const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';
const cspConnectSources = [
  "'self'",
  'https://*.clerk.accounts.dev',
  'https://*.clerk.com',
  'https://api.clerk.com',
  'https://clerk.shared.lcl.dev',
  'https://challenges.cloudflare.com',
  'wss://*.clerk.accounts.dev',
  'wss://*.clerk.com',
];

if (!isProduction) {
  cspConnectSources.push('http://localhost:*', 'http://127.0.0.1:*', 'ws://localhost:*', 'ws://127.0.0.1:*');
}

const nextConfig = {
  experimental: {
    optimizePackageImports: ['next-intl'],
  },
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  allowedDevOrigins: ['192.168.11.111', 'localhost', '127.0.0.1', '*.trycloudflare.com'],
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.shared.lcl.dev https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; media-src 'self' data: blob:; font-src 'self' data: https:; connect-src ${cspConnectSources.join(' ')}; frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.shared.lcl.dev https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.shared.lcl.dev https://accounts.google.com https://github.com https://appleid.apple.com;`,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:locale/dashboard/publications',
        destination: '/:locale/feed',
        permanent: false,
      },
      {
        source: '/:locale/profile/public',
        destination: '/:locale/dashboard/profile',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendInternalUrl}/uploads/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendInternalUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
