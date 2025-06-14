
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
import { LayoutDashboard, Route, ListOrdered, DollarSign, MapPinned, Wand2, Globe, Repeat, Briefcase, Map, Users, Building, Mail, Phone, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <header className="mb-10 text-center">
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <LayoutDashboard className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Oversee and manage all aspects of your Itinerary Ace application.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           <DashboardCard
            title="Itinerary Creation Suite"
            description="Craft new itineraries, plan day-by-day activities, and calculate costs with our powerful planner."
            href="/planner"
            icon={Route}
            buttonText="Launch Planner"
            className="lg:col-span-1 bg-accent/5 border-accent/30"
          />
          <DashboardCard
            title="Manage Saved Itineraries"
            description="View, edit, and organize all client itineraries. Track progress and manage details."
            href="/admin/itineraries"
            icon={ListOrdered}
            buttonText="View Itineraries"
            className="lg:col-span-1"
          />
          <DashboardCard
            title="Manage Service Prices"
            description="Set and adjust pricing for all services: hotels, activities, transfers, meals, and miscellaneous items."
            href="/admin/pricing"
            icon={DollarSign}
            buttonText="Update Prices"
            className="lg:col-span-1"
          />
          <DashboardCard
            title="Location Management"
            description="Define and manage countries and their associated provinces/cities for tour operations and pricing."
            href="/admin/locations"
            icon={Map}
            buttonText="Manage Locations"
            className="lg:col-span-1"
          />
          <DashboardCard
            title="AI Image Describer"
            description="Upload an image and let AI provide a detailed description. Useful for content creation."
            href="/image-describer"
            icon={Wand2}
            buttonText="Describe Image"
            className="lg:col-span-1"
          />
          <DashboardCard
            title="Currency Converter"
            description="Convert amounts between currencies using manually defined exchange rates."
            href="/admin/currency-converter"
            icon={Repeat}
            buttonText="Use Converter"
            className="lg:col-span-1"
          />
           <DashboardCard
            title="Manage Agencies & Agents"
            description="Administer travel agencies and their affiliated agents."
            href="/admin/agencies"
            icon={Users}
            buttonText="Manage Agencies"
            className="lg:col-span-1"
          />
           <DashboardCard
            title="Agent Tools & Portal"
            description="Access the dashboard designed for travel agents to manage their specific tasks and clients."
            href="/agent"
            icon={Briefcase}
            buttonText="Go to Agent Portal"
            className="lg:col-span-1 border-secondary"
          />
        </div>
      </div>
    </main>
  );
}
