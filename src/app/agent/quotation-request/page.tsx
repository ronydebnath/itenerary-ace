/**
 * @fileoverview This page allows travel agents to submit a new quotation request.
 * It presents a form with fields for client information, trip details (destination, dates,
 * budget), accommodation preferences, activity preferences, and flight requirements.
 * Submitted requests are stored locally using `localStorage`.
 *
 * @bangla এই পৃষ্ঠাটি ট্রাভেল এজেন্টদের একটি নতুন উদ্ধৃতি অনুরোধ জমা দেওয়ার অনুমতি দেয়।
 * এটিতে ক্লায়েন্টের তথ্য, ভ্রমণের বিবরণ (গন্তব্য, তারিখ, বাজেট), আবাসনের পছন্দ,
 * কার্যকলাপের পছন্দ এবং ফ্লাইটের প্রয়োজনীয়তার জন্য ক্ষেত্র সহ একটি ফর্ম উপস্থাপন করা হয়েছে।
 * জমা দেওয়া অনুরোধগুলি স্থানীয়ভাবে `localStorage` ব্যবহার করে সংরক্ষণ করা হয়।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QuotationRequestForm } from '@/components/agent/quotation-request-form';
import type { QuotationRequest } from '@/types/quotation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FilePlus, LayoutDashboard } from 'lucide-react';

const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';

export default function AgentQuotationRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const placeholderAgentId = "agent_default_user"; 

  const handleFormSubmit = (data: QuotationRequest) => {
    const newRequest = { ...data, agentId: placeholderAgentId };
    console.log("New Quotation Request Submitted:", newRequest);

    try {
      const storedRequestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
      const existingRequests: QuotationRequest[] = storedRequestsString ? JSON.parse(storedRequestsString) : [];
      existingRequests.push(newRequest);
      localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(existingRequests));

      toast({
        title: "Request Submitted!",
        description: "Your quotation request has been sent. Admin will be notified and will prepare a proposal.",
        variant: "default",
      });
      router.push('/agent'); 
    } catch (error) {
      console.error("Error saving quotation request:", error);
      toast({
        title: "Submission Error",
        description: "Could not save your quotation request locally. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    router.push('/agent');
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2">
              <Link href="/agent">
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 self-start sm:self-center">
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div className="text-center sm:text-left flex-grow">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center sm:justify-start">
                  <FilePlus className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Request New Quotation
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Fill in the details below to request a new travel quotation.
                </CardDescription>
              </div>
              <Link href="/agent" passHref>
                <Button variant="outline" size="sm" className="self-start sm:self-auto text-xs sm:text-sm">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <QuotationRequestForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              defaultAgentId={placeholderAgentId}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

