
import type {NextConfig} from 'next';

// Check for required environment variables during development startup
if (process.env.NODE_ENV === 'development') {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here' || process.env.OPENROUTER_API_KEY.trim() === '') {
    console.warn('\n\n\x1b[33m%s\x1b[0m', '****************************** ATTENTION ******************************');
    console.warn('\x1b[33m%s\x1b[0m', '[WARNING] OPENROUTER_API_KEY is not set, is empty, or is using the placeholder value.');
    console.warn('\x1b[33m%s\x1b[0m', 'AI features (Image Describer, Contract Parser, AI Suggestions) WILL NOT WORK (and will not incur API costs).');
    console.warn('\x1b[33m%s\x1b[0m', 'To enable these features, create a `.env.local` file and add your OpenRouter API key.');
    console.warn('\x1b[33m%s\x1b[0m', 'Example: OPENROUTER_API_KEY="your_actual_openrouter_key_here"');
    console.warn('\x1b[33m%s\x1b[0m', '*********************************************************************\n\n');
  }
  if (!process.env.EXCHANGERATE_API_KEY || process.env.EXCHANGERATE_API_KEY === 'YOUR_EXCHANGERATE_API_KEY_HERE' || process.env.EXCHANGERATE_API_KEY.trim() === '') {
    console.warn('\n\n\x1b[33m%s\x1b[0m', '****************************** ATTENTION ******************************');
    console.warn('\x1b[33m%s\x1b[0m', '[WARNING] EXCHANGERATE_API_KEY is not set, is empty, or is using the placeholder value.');
    console.warn('\x1b[33m%s\x1b[0m', 'Live currency exchange rate fetching WILL NOT WORK. The app will use fallback default rates.');
    console.warn('\x1b[33m%s\x1b[0m', 'To enable live rates, get a free API key from https://www.exchangerate-api.com');
    console.warn('\x1b[33m%s\x1b[0m', 'and add it to your `.env.local` file.');
    console.warn('\x1b[33m%s\x1b[0m', 'Example: EXCHANGERATE_API_KEY="your_actual_exchangerateapi_key"');
    console.warn('\x1b[33m%s\x1b[0m', '*********************************************************************\n\n');
  }
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here' || process.env.SENDGRID_API_KEY.trim() === '') {
    console.warn('\n\n\x1b[33m%s\x1b[0m', '****************************** ATTENTION ******************************');
    console.warn('\x1b[33m%s\x1b[0m', '[WARNING] SENDGRID_API_KEY is not set, is empty, or is using the placeholder value.');
    console.warn('\x1b[33m%s\x1b[0m', 'Email sending functionality (e.g., password resets) WILL NOT WORK through SendGrid.');
    console.warn('\x1b[33m%s\x1b[0m', 'To enable email sending, set SENDGRID_API_KEY in your `.env.local` file.');
    console.warn('\x1b[33m%s\x1b[0m', 'Example: SENDGRID_API_KEY="SG.your_actual_sendgrid_key"');
    console.warn('\x1b[33m%s\x1b[0m', 'Also ensure EMAIL_FROM is set for the sender address.');
    console.warn('\x1b[33m%s\x1b[0m', 'Example: EMAIL_FROM="noreply@example.com"');
    console.warn('\x1b[33m%s\x1b[0m', '*********************************************************************\n\n');
  }
}

const nextConfig: NextConfig = {
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
  devIndicators: {
    allowedDevOrigins: [
      'http://localhost:9002',
    'http://127.0.0.1:9002',
    'http://192.168.1.102:9002', // <-- Add your local network IP
    'https://6000-firebase-studio-1749328696453.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
    ],
  },
  env: {
    // Make EXCHANGERATE_API_KEY available on the client-side if needed (prefixed with NEXT_PUBLIC_)
    // If it's only used server-side (e.g., in API routes or server components), no need to expose it here.
    // For this hook (useExchangeRates), it needs to be client-side.
    NEXT_PUBLIC_EXCHANGERATE_API_KEY: process.env.EXCHANGERATE_API_KEY,
    // SENDGRID_API_KEY and EMAIL_FROM should typically NOT be exposed to the client.
    // They are used by backend services. This env block is for client-side env vars.
  }
};

export default nextConfig;

