/**
 * @fileoverview This file serves as the main dashboard page for travel agents.
 * It displays cards linking to various agent-specific functionalities like itinerary creation,
 * requesting quotations, and managing their professional profile. It acts as the central hub
 * for agents using the application.
 *
 * @bangla এই ফাইলটি ট্রাভেল এজেন্টদের জন্য প্রধান ড্যাশবোর্ড পৃষ্ঠা হিসেবে কাজ করে।
 * এটি ভ্রমণপথ তৈরি, উদ্ধৃতি অনুরোধ করা এবং তাদের পেশাদার প্রোফাইল পরিচালনার মতো বিভিন্ন
 * এজেন্ট-নির্দিষ্ট কার্যকারিতার সাথে লিঙ্ক করা কার্ড প্রদর্শন করে। এটি অ্যাপ্লিকেশন ব্যবহারকারী
 * এজেন্টদের জন্য কেন্দ্রীয় হাব হিসেবে কাজ করে।
 */
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Briefcase, Route, Users, ListOrdered, LayoutDashboard, UserCog, FilePlus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentDashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
}

function AgentDashboardCard({ title, description, href, icon: Icon, buttonText = "Access", className, disabled = false }: AgentDashboardCardProps) {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card", className, disabled && "opacity-60 cursor-not-allowed")}>
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
        <Link href={disabled ? "#" : href} passHref className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2.5 sm:py-3" disabled={disabled}>
            {buttonText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function AgentDashboardPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <header className="mb-8 sm:mb-10 text-center">
          <div className="inline-block p-3 sm:p-4 bg-primary/10 rounded-full mb-4">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">Agent Dashboard</h1>
          <p className="mt-2 text-md sm:text-lg text-muted-foreground">
            Manage your clients, itineraries, and bookings.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <AgentDashboardCard
            title="Itinerary Creation Suite"
            description="Craft new itineraries, plan day-by-day activities, and calculate costs for your clients."
            href="/planner"
            icon={Route}
            buttonText="Launch Planner"
            className="lg:col-span-1 bg-accent/5 border-accent/30"
          />
          <AgentDashboardCard
            title="Request New Quotation"
            description="Fill out a detailed form to request a new travel quotation from the admin team."
            href="/agent/quotation-request"
            icon={FilePlus}
            buttonText="Request Quote"
          />
           <AgentDashboardCard
            title="My Quotation Requests"
            description="View the status of your submitted quotation requests and access proposals."
            href="/agent/my-quotation-requests"
            icon={ClipboardList}
            buttonText="View My Requests"
          />
          <AgentDashboardCard
            title="My Agent Profile"
            description="Update your contact information, agency details, and professional preferences."
            href="/agent/profile"
            icon={UserCog}
            buttonText="Manage Profile"
          />
          <AgentDashboardCard
            title="My Client Itineraries"
            description="View, edit, and organize all itineraries you have created for your clients. (Coming Soon)"
            href="#"
            icon={ListOrdered}
            buttonText="View My Itineraries"
            disabled
          />
           <AgentDashboardCard
            title="Client Management"
            description="Manage your client profiles, contact information, and travel preferences. (Coming Soon)"
            href="#"
            icon={Users}
            buttonText="Manage Clients"
            disabled
          />
        </div>

        <div className="mt-10 sm:mt-12 text-center">
            <Link href="/" passHref>
                <Button variant="outline">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Admin Dashboard (Dev Access)
                </Button>
            </Link>
             <p className="text-xs text-muted-foreground mt-2">Note: In a production app, agents would not typically access the Admin Dashboard.</p>
        </div>
      </div>
    </main>
  );
}
