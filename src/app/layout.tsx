/**
 * @fileoverview This file defines the root layout for the Next.js application.
 * It wraps all pages, sets up global styles, and includes components like the Toaster
 * that need to be present on every page. It also defines global metadata for the application.
 *
 * @bangla এই ফাইলটি Next.js অ্যাপ্লিকেশনের রুট লেআউট নির্ধারণ করে।
 * এটি সমস্ত পৃষ্ঠাগুলিকে আবৃত করে, গ্লোবাল স্টাইল সেট আপ করে এবং টোস্টারের মতো
 * কম্পোনেন্টগুলি অন্তর্ভুক্ত করে যা প্রতিটি পৃষ্ঠায় উপস্থিত থাকা প্রয়োজন। এটি অ্যাপ্লিকেশনের
 * জন্য গ্লোবাল মেটাডেটাও নির্ধারণ করে।
 */
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthButton } from '@/components/auth-button'; // Import AuthButton
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Itinerary Ace',
  description: 'Smart Travel Itinerary Cost Calculator by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head />
      <body className="font-body antialiased bg-background text-foreground" suppressHydrationWarning>
        {/* Removed AuthButton from global layout for page-specific control */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
