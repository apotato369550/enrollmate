/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production build
  productionBrowserSourceMaps: false, // Reduce bundle size
  compress: true,

  async headers() {
    return [
      {
        // Apply CORS headers to all API routes for browser extension
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          // Security headers (also in vercel.json, but good to have here too)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path((?!api).*)*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Redirect old URLs if needed
  async redirects() {
    return [];
  },

  // Add custom environment variables
  env: {
    // These are available in both server and client
  },
};

export default nextConfig;
