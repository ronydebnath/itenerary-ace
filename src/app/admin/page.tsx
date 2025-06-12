
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Cog, MapPinned, ListPlus, Home, LayoutDashboard, ListOrdered, DollarSign, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ensure this import is present

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
            title="Manage Itineraries"
            description="View, edit, and organize all saved client itineraries. Track progress and manage details."
            href="/admin/itineraries"
            icon={ListOrdered}
            buttonText="View Itineraries"
            className="lg:col-span-1"
          />
          <DashboardCard
            title="Manage Provinces"
            description="Define and update geographical locations (provinces or cities) used for pricing and filtering."
            href="/admin/provinces"
            icon={MapPinned}
            buttonText="Edit Provinces"
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

        <div className="text-center mt-12">
          <Link href="/" passHref>
            <Button variant="outline" size="lg" className="text-lg py-7 px-8 border-primary text-primary hover:bg-primary/5">
              <Home className="mr-3 h-5 w-5" /> Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
