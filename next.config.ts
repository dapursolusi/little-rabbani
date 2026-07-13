import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['@react-pdf/renderer'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
