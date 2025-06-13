
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { AgentProfileForm } from '@/components/agent/agent-profile-form';
import type { AgentProfile } from '@/types/agent';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, UserCog, LayoutDashboard } from 'lucide-react';
import { useCountries } from '@/hooks/useCountries';

const AGENT_PROFILE_STORAGE_KEY = 'itineraryAce_agentProfile_default'; // Using a single key for now

export default function AgentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [initialData, setInitialData] = React.useState<Partial<AgentProfile> | undefined>(undefined);
  const [isProfileLoading, setIsProfileLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(AGENT_PROFILE_STORAGE_KEY);
      if (storedProfile) {
        setInitialData(JSON.parse(storedProfile));
      } else {
        // Set some sensible defaults if no profile is found, including a default country if available
        const defaultCountryId = countries.length > 0 ? countries[0].id : "";
        setInitialData({
          preferredCurrency: "USD",
          agencyAddress: { countryId: defaultCountryId, street: "", city: "", postalCode: "" }
        });
      }
    } catch (error) {
      console.error("Error loading agent profile:", error);
      toast({ title: "Error", description: "Could not load agent profile.", variant: "destructive" });
    }
    setIsProfileLoading(false);
  }, [toast, countries]); // Add countries to dependency array for default setting

  const handleFormSubmit = (data: AgentProfile) => {
    try {
      localStorage.setItem(AGENT_PROFILE_STORAGE_KEY, JSON.stringify(data));
      toast({ title: "Success", description: "Agent profile updated." });
      router.push('/agent'); // Navigate back to agent dashboard or a confirmation page
    } catch (error) {
      console.error("Error saving agent profile:", error);
      toast({ title: "Error", description: "Could not save agent profile.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    router.push('/agent');
  };
  
  if (isProfileLoading || isLoadingCountries) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        Loading agent profile form...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-3xl py-8">
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
                  <UserCog className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Agent Profile
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Manage your professional information and preferences.
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
            <AgentProfileForm
              key={JSON.stringify(initialData)} // Re-render if initialData changes significantly
              initialData={initialData}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isLoadingCountries={isLoadingCountries}
              availableCountries={countries}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
