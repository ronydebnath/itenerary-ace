
"use client";
// This page is no longer directly used for country management.
// Country management is now part of /admin/locations.
// This file can be deleted, but for now, we'll redirect or show a message.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function OldAdminCountriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/locations?tab=countries');
  }, [router]);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-4">Redirecting to Location Management...</p>
        <Globe className="h-16 w-16 text-primary mx-auto mb-4" />
        <p className="text-sm">
          Country management has been moved. If you are not redirected, please
          <Link href="/admin/locations?tab=countries" className="text-primary hover:underline ml-1">
            click here
          </Link>.
        </p>
         <Link href="/" passHref className="mt-6 inline-block">
            <Button variant="outline">Go to Admin Dashboard</Button>
          </Link>
      </div>
    </main>
  );
}

