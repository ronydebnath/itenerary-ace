
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'http://localhost:9002',
    'http://127.0.0.1:9002',
    'http://192.168.1.102:9002', // <-- Add your local network IP
    'https://6000-firebase-studio-1749328696453.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
  ],
  experimental: {
    // Add other experimental flags here if needed in the future
  },
};

export default nextConfig;
