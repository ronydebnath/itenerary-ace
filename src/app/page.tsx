
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LayoutDashboard, Route, ListOrdered, DollarSign, MapPinned, Wand2, Globe, Repeat } from 'lucide-react';
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
            title="Manage Countries"
            description="Define and manage countries for multi-destination tour operations."
            href="/admin/countries"
            icon={Globe}
            buttonText="Edit Countries"
            className="lg:col-span-1"
          />
           <DashboardCard
            title="Manage Provinces"
            description="Define and update geographical locations (provinces or cities) used for pricing and filtering, linked to countries."
            href="/admin/provinces"
            icon={MapPinned}
            buttonText="Edit Provinces"
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
          
          {/* Example of a potential future card - you can uncomment and implement */}
          {/*
          <DashboardCard
            title="User Management"
            description="Administer user accounts, roles, and permissions for your team."
            href="/admin/users" // Hypothetical link
            icon={Users}
            buttonText="Manage Users"
            className="border-dashed border-muted-foreground/50"
          />
          <DashboardCard
            title="Analytics & Reports"
            description="View key metrics, popular destinations, and cost trends for your itineraries."
            href="/admin/reports" // Hypothetical link
            icon={BarChart3}
            buttonText="View Reports"
            className="border-dashed border-muted-foreground/50"
          />
          */}
        </div>
      </div>
    </main>
  );
}

