
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
import { LayoutDashboard, Route, ListOrdered, DollarSign, Wand2, Briefcase, Map, Users, BadgeDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  buttonText?: string;
  className?: string;
}

function DashboardCard({ title, description, href, icon: Icon, buttonText = "Manage", className }: DashboardCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-md">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Link href={href} passHref className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-md py-3">
            {buttonText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function AdminDashboardPage() {
  // This page content is now effectively moved to src/app/page.tsx
  // Redirecting to the root which serves as the admin dashboard.
  // In a real app with distinct roles, this might be a protected route.
  const router = React.useRef<any>(null); // Using ref to avoid direct useRouter import if not needed

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import useRouter only on client-side
      import('next/navigation').then(mod => {
        if (mod.useRouter) {
          router.current = mod.useRouter();
          if (router.current) {
             router.current.replace('/');
          }
        }
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <p>Redirecting to Admin Dashboard...</p>
      {/* You can add a loader here */}
    </main>
  );
}
