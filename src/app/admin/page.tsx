
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cog, MapPinned, ListPlus, Home, LayoutDashboard } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary mb-4">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Manage your application settings and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Link href="/admin/provinces" passHref>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg py-6">
              <MapPinned className="mr-3 h-5 w-5" /> Manage Provinces
            </Button>
          </Link>
          <Link href="/admin/pricing" passHref>
            <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg py-6">
              <ListPlus className="mr-3 h-5 w-5" /> Manage Service Prices
            </Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full text-lg py-6 mt-4">
              <Home className="mr-3 h-5 w-5" /> Go to Homepage
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
