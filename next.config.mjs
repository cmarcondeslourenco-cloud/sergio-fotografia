/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  experimental: {
    serverComponentsExternalPackages: ['archiver'],
  },
  images: {
    // Mitigação temporária: evita o Image Optimizer do Next 14 até a atualização principal auditada.
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
    return [{
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
