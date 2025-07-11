/**
 * @fileoverview This page serves as the central location for managing geographical data
 * within the application, such as countries and provinces. It uses a tabbed interface
 * to separate the management of countries and provinces, each handled by their respective
 * manager components (`CountryManager` and `ProvinceManager`).
 *
 * @bangla এই পৃষ্ঠাটি অ্যাপ্লিকেশনের মধ্যে ভৌগোলিক ডেটা, যেমন দেশ এবং প্রদেশ, পরিচালনার
 * কেন্দ্রীয় স্থান হিসেবে কাজ করে। এটি দেশ এবং প্রদেশ পরিচালনার জন্য একটি ট্যাবড ইন্টারফেস
 * ব্যবহার করে, যেখানে প্রতিটি নিজ নিজ ম্যানেজার কম্পোনেন্ট (`CountryManager` এবং `ProvinceManager`) দ্বারা পরিচালিত হয়।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { CountryManager } from '@/components/admin/country-manager';
import { ProvinceManager } from '@/components/admin/province-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Map, Globe, MapPinned } from 'lucide-react';

export default function AdminLocationsPage() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="container mx-auto py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Map className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 md:h-8 md:w-8" /> Location Management
            </h1>
          </div>
        </div>

        <Tabs defaultValue="countries" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8">
            <TabsTrigger value="countries" className="text-sm sm:text-base py-2 sm:py-2.5 data-[state=active]:shadow-md">
              <Globe className="mr-1.5 sm:mr-2 h-4 w-4 md:h-5 md:w-5" /> Countries
            </TabsTrigger>
            <TabsTrigger value="provinces" className="text-sm sm:text-base py-2 sm:py-2.5 data-[state=active]:shadow-md">
              <MapPinned className="mr-1.5 sm:mr-2 h-4 w-4 md:h-5 md:w-5" /> Provinces
            </TabsTrigger>
          </TabsList>
          <TabsContent value="countries">
            <CountryManager />
          </TabsContent>
          <TabsContent value="provinces">
            <ProvinceManager />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
