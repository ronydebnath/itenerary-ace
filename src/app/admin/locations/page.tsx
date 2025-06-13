
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
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <LayoutDashboard className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Map className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Location Management
            </h1>
          </div>
        </div>

        <Tabs defaultValue="countries" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="countries" className="text-sm md:text-base py-2.5">
              <Globe className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Countries
            </TabsTrigger>
            <TabsTrigger value="provinces" className="text-sm md:text-base py-2.5">
              <MapPinned className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Provinces
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
