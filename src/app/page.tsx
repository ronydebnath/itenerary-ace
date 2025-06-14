
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
import { LayoutDashboard, Route, ListOrdered, DollarSign, Wand2, Briefcase, Map, Users, BadgeDollarSign, ListChecks } from 'lucide-react';
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
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-semibold text-primary">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-md">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow px-4 sm:px-6 pt-2 pb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="px-4 sm:px-6 pb-4">
        <Link href={href} passHref className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2.5 sm:py-3">
            {buttonText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-6xl">
        <header className="mb-8 sm:mb-10 text-center">
          <div className="flex justify-between items-center w-full mb-4">
            <div></div> {/* Spacer */}
            <div className="inline-block p-3 sm:p-4 bg-primary/10 rounded-full">
              <LayoutDashboard className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <div className="self-start"> {/* Placeholder for potential future buttons like login/logout */} </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-md sm:text-lg text-muted-foreground">
            Oversee and manage all aspects of your Itinerary Ace application.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
           <DashboardCard
            title="Itinerary Creation Suite"
            description="Craft new itineraries, plan day-by-day activities, and calculate costs with our powerful planner."
            href="/planner"
            icon={Route}
            buttonText="Launch Planner"
            className="lg:col-span-1 bg-accent/5 border-accent/30"
          />
          <DashboardCard
            title="Manage Quotation Requests"
            description="View and process new quotation requests from agents. Create itinerary proposals."
            href="/admin/quotation-requests"
            icon={ListChecks}
            buttonText="View Requests"
          />
          <DashboardCard
            title="Manage Saved Itineraries"
            description="View, edit, and organize all client itineraries. Track progress and manage details."
            href="/admin/itineraries"
            icon={ListOrdered}
            buttonText="View Itineraries"
          />
          <DashboardCard
            title="Manage Service Prices"
            description="Set and adjust pricing for all services: hotels, activities, transfers, meals, and miscellaneous items."
            href="/admin/pricing"
            icon={DollarSign}
            buttonText="Update Prices"
          />
          <DashboardCard
            title="Location Management"
            description="Define and manage countries and their associated provinces/cities for tour operations and pricing."
            href="/admin/locations"
            icon={Map}
            buttonText="Manage Locations"
          />
          <DashboardCard
            title="Currency Management"
            description="Manage currency codes, exchange rates, conversion markups, and perform currency conversions."
            href="/admin/currencies-management"
            icon={BadgeDollarSign}
            buttonText="Manage Currencies & Rates"
          />
           <DashboardCard
            title="AI Image Describer"
            description="Upload an image and let AI provide a detailed description. Useful for content creation."
            href="/image-describer"
            icon={Wand2}
            buttonText="Describe Image"
          />
          <DashboardCard
            title="Manage Agencies & Agents"
            description="Administer travel agencies and their affiliated agents."
            href="/admin/agencies"
            icon={Users}
            buttonText="Manage Agencies"
          />
           <DashboardCard
            title="Agent Tools & Portal"
            description="Access the dashboard designed for travel agents to manage their specific tasks and clients."
            href="/agent"
            icon={Briefcase}
            buttonText="Go to Agent Portal"
            className="border-secondary"
          />
        </div>
      </div>
    </main>
  );
}
