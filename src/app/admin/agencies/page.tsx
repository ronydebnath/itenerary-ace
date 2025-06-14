
/**
 * @fileoverview This page serves as the main hub for managing travel agencies and their agents.
 * It displays a list of all registered agencies, allows for the creation of new agencies,
 * and provides options to edit or delete existing ones. For each agency, it also shows
 * a list of affiliated agents.
 *
 * @bangla এই পৃষ্ঠাটি ট্রাভেল এজেন্সি এবং তাদের এজেন্টদের পরিচালনার প্রধান কেন্দ্র হিসেবে কাজ করে।
 * এটি সমস্ত নিবন্ধিত এজেন্সিগুলির একটি তালিকা প্রদর্শন করে, নতুন এজেন্সি তৈরি করার অনুমতি দেয়,
 * এবং বিদ্যমান এজেন্সিগুলি সম্পাদনা বা মুছে ফেলার বিকল্প সরবরাহ করে। প্রতিটি এজেন্সির জন্য, এটি
 * অনুমোদিত এজেন্টদের একটি তালিকাও দেখায়।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { AgencyManager } from '@/components/admin/agency-manager';
import { LayoutDashboard, Users } from 'lucide-react';

export default function AdminAgenciesPage() {
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
              <Users className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Agency & Agent Management
            </h1>
          </div>
        </div>
        <AgencyManager />
      </div>
    </main>
  );
}
