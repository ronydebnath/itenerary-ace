
// This file enables the /admin/pricing route.
// The actual UI is in PricingManager component.
"use client";

import { PricingManager } from '@/components/admin/pricing-manager';

export default function AdminPricingPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <PricingManager />
    </main>
  );
}
