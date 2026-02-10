/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@agentos/shared'],
};

module.exports = nextConfig;
