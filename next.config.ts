import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: [],
    remotePatterns: [],
  },
  env: {
    AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 's3ui--bucket',
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
