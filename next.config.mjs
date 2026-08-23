/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:3000';
    const cleanBackendUrl = backendUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/auth/:path*',
        destination: `${cleanBackendUrl}/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${cleanBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
