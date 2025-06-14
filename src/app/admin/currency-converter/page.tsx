
// This file is no longer needed as its functionality has been merged
// into /admin/currencies-management/page.tsx.
// It can be safely deleted. 
// For now, redirecting to the new combined page.

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Repeat } from 'lucide-react';

export default function OldCurrencyConverterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/currencies-management');
  }, [router]);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-4">Redirecting to Currency Management...</p>
        <Repeat className="h-16 w-16 text-primary mx-auto mb-4" />
        <p className="text-sm">
          Currency Converter has been merged with Currency Management. If you are not redirected, please
          <Link href="/admin/currencies-management" legacyBehavior>
            <a className="text-primary hover:underline ml-1">click here</a>
          </Link>.
        </p>
         <Link href="/admin" passHref className="mt-6 inline-block">
            <Button variant="outline">Go to Admin Dashboard</Button>
          </Link>
      </div>
    </main>
  );
}
