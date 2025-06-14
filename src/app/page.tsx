
/**
 * @fileoverview This file serves as the main admin dashboard page for the application.
 * It displays various cards linking to different management sections like itinerary creation,
 * service pricing, location management, and AI tools. It functions as the primary entry
 * point for administrative tasks.
 *
 * @bangla এই ফাইলটি অ্যাপ্লিকেশনের প্রধান অ্যাডমিন ড্যাশবোর্ড পৃষ্ঠা হিসেবে কাজ করে।
 * এটি ভ্রমণপথ তৈরি, পরিষেবা মূল্য নির্ধারণ, অবস্থান পরিচালনা এবং এআই সরঞ্জামগুলির মতো
 * বিভিন্ন পরিচালনা বিভাগে লিঙ্ক করা বিভিন্ন কার্ড প্রদর্শন করে। এটি প্রশাসনিক কাজগুলির
 * জন্য প্রাথমিক প্রবেশদ্বার হিসেবে কাজ করে।
 */
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LayoutDashboard, Route, ListOrdered, DollarSign, Wand2, Briefcase, Map, Users, Building, Mail, Phone, MapPin, BadgeDollarSign, LogIn, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';
import React from 'react';
import { AuthButton } from '@/components/auth-button';


export default function LandingOrDashboardRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole === 'admin') {
        router.replace('/admin');
      } else if (userRole === 'agent') {
        router.replace('/agent');
      } else {
        // Default authenticated user to agent dashboard or a generic dashboard
        router.replace('/agent'); 
      }
    } else {
      // If unauthenticated, redirect to login
      router.replace('/auth/login');
    }
  }, [status, session, router]);

  // Show a loading state while determining status and redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Loading Itinerary Ace...</p>
    </div>
  );
}
