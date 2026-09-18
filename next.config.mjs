/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  serverExternalPackages: ['archiver'],
  images: {
    // Previews já são gerados pelo pipeline Sharp; preservar o fluxo existente.
    unoptimized: true,
    remotePatterns: (() => {
      try {
        const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
        return [{ protocol: url.protocol.replace(':', ''), hostname: url.hostname }];
      } catch {
        return [];
      }
    })(),
  },
  async headers() {
    return [{ source: '/c/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }, { source: '/pedido/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }, {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
