/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:7778/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:7778/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig 