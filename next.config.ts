
import type {NextConfig} from 'next';

// Check for required environment variables during development startup
if (process.env.NODE_ENV === 'development') {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here' || process.env.OPENROUTER_API_KEY.trim() === '') {
    console.warn('\n\n\x1b[33m%s\x1b[0m', '****************************** ATTENTION ******************************');
    console.warn('\x1b[33m%s\x1b[0m', '[WARNING] OPENROUTER_API_KEY is not set, is empty, or is using the placeholder value.');
    console.warn('\x1b[33m%s\x1b[0m', 'The AI features (Image Describer, Contract Parser, AI Suggestions) WILL NOT WORK.');
    console.warn('\x1b[33m%s\x1b[0m', 'To enable these features, please create a `.env.local` file in your project root');
    console.warn('\x1b[33m%s\x1b[0m', 'and add your OpenRouter API key like this:');
    console.warn('\x1b[33m%s\x1b[0m', 'OPENROUTER_API_KEY="your_actual_openrouter_key_here"');
    console.warn('\x1b[33m%s\x1b[0m', 'You may also want to set:');
    console.warn('\x1b[33m%s\x1b[0m', 'OPENROUTER_HTTP_REFERER="your_site_url_or_app_name" (e.g., http://localhost:3000 or ItineraryAce)');
    console.warn('\x1b[33m%s\x1b[0m', 'OPENROUTER_X_TITLE="Your App Name" (e.g., ItineraryAce)');
    console.warn('\x1b[33m%s\x1b[0m', 'After adding the key, restart your Next.js development server.');
    console.warn('\x1b[33m%s\x1b[0m', '*********************************************************************\n\n');
  }
}

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
};

export default nextConfig;
