/**
 * @fileoverview This page allows an agent to manage their professional profile
 * and view details of their associated agency.
 *
 * @bangla এই পৃষ্ঠাটি একজন এজেন্টকে তাদের পেশাদার প্রোফাইল পরিচালনা করতে এবং তাদের
 * সংশ্লিষ্ট এজেন্সির বিবরণ দেখতে দেয়।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { AgentUserForm } from '@/components/agent/agent-user-form';
import type { Agency, AgentProfile } from '@/types/agent';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, Users, UserCog, LayoutDashboard, Loader2, Mail, Phone, MapPin, Globe, Edit, Workflow, Calendar, Sparkles } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useCountries } from '@/hooks/useCountries';
import { Separator } from '@/components/ui/separator';

const PLACEHOLDER_AGENT_ID = "agent_default_user"; // Placeholder for actual logged-in agent

export default function AgentProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { agents, agencies, isLoading: isLoadingAgentsHook, updateAgent, refreshAgentData } = useAgents();
  const { getCountryById, isLoading: isLoadingCountries } = useCountries();

  const [currentAgentProfile, setCurrentAgentProfile] = React.useState<AgentProfile | null>(null);
  const [associatedAgency, setAssociatedAgency] = React.useState<Agency | null>(null);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);

  React.useEffect(() => {
    refreshAgentData();
  }, [refreshAgentData]);

  React.useEffect(() => {
    if (!isLoadingAgentsHook && agents.length > 0 && agencies.length > 0) {
      const agent = agents.find(a => a.id === PLACEHOLDER_AGENT_ID);
      if (agent) {
        setCurrentAgentProfile(agent);
        const agency = agencies.find(ag => ag.id === agent.agencyId);
        setAssociatedAgency(agency || null);
      } else {
        setCurrentAgentProfile(null);
        setAssociatedAgency(null);
      }
    }
  }, [agents, agencies, isLoadingAgentsHook]);

  const handleProfileUpdate = (updatedProfileData: AgentProfile) => {
    if (currentAgentProfile) {
      updateAgent({ ...currentAgentProfile, ...updatedProfileData });
      toast({ title: "Profile Updated", description: "Your profile details have been saved." });
      setIsEditingProfile(false); 
      refreshAgentData(); 
    }
  };

  const getCountryName = (countryId?: string): string => {
    if (!countryId || isLoadingCountries) return 'N/A';
    return getCountryById(countryId)?.name || 'Unknown Country';
  };

  const isLoading = isLoadingAgentsHook || isLoadingCountries;

  if (isLoading && !currentAgentProfile) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </main>
    );
  }

  if (!currentAgentProfile) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-3xl py-8 text-center">
          <UserCog className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold text-muted-foreground">Agent Profile Not Found</h1>
          <p className="text-muted-foreground mt-2">
            Could not load your profile. Please try again later or contact support.
          </p>
          <Link href="/agent" passHref className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agent Dashboard
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
          <div className="flex items-center gap-2">
            <Link href="/agent">
              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center">
              <UserCog className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 md:h-8 md:w-8" /> My Profile
            </h1>
          </div>
          {!isEditingProfile && (
            <Button onClick={() => setIsEditingProfile(true)} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground self-start sm:self-auto">
              <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </div>

        {isEditingProfile ? (
          <Card className="shadow-xl">
            <CardHeader className="p-4 sm:p-5">
              <CardTitle className="text-lg sm:text-xl text-primary">Edit Your Profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Make changes to your professional information.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <AgentUserForm
                initialData={currentAgentProfile}
                agencyId={currentAgentProfile.agencyId}
                onSubmit={handleProfileUpdate}
                onCancel={() => setIsEditingProfile(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 md:space-y-8">
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-primary flex items-center">
                        {currentAgentProfile.profilePictureUrl ? (
                            <img src={currentAgentProfile.profilePictureUrl} alt={currentAgentProfile.fullName} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover mr-3 border-2 border-primary/30" />
                        ) : (
                            <UserCog className="h-8 w-8 sm:h-10 sm:w-10 mr-3 text-primary/80" />
                        )}
                        {currentAgentProfile.fullName}
                    </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                    {currentAgentProfile.email} {currentAgentProfile.phoneNumber && `| ${currentAgentProfile.phoneNumber}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3 text-sm text-muted-foreground">
                {currentAgentProfile.agencyName && <p className="flex items-center"><Workflow className="mr-2 h-4 w-4 text-primary/70"/> <span className="font-medium text-foreground">Branch/Office:</span><span className="ml-1.5">{currentAgentProfile.agencyName}</span></p>}
                {currentAgentProfile.specializations && <p className="flex items-center"><Sparkles className="mr-2 h-4 w-4 text-primary/70"/> <span className="font-medium text-foreground">Specializations:</span><span className="ml-1.5">{currentAgentProfile.specializations}</span></p>}
                {currentAgentProfile.yearsOfExperience !== undefined && <p className="flex items-center"><Calendar className="mr-2 h-4 w-4 text-primary/70"/><span className="font-medium text-foreground">Years of Experience:</span><span className="ml-1.5">{currentAgentProfile.yearsOfExperience}</span></p>}
                {currentAgentProfile.bio && <div className="pt-2"><p className="font-medium text-foreground mb-1">Bio:</p><p className="whitespace-pre-wrap text-xs leading-relaxed bg-muted/50 p-3 rounded-md border">{currentAgentProfile.bio}</p></div>}
              </CardContent>
            </Card>

            {associatedAgency && (
              <Card className="shadow-lg border-secondary/30">
                <CardHeader className="p-4 sm:p-5">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-secondary-foreground flex items-center"><Building className="mr-2 h-5 w-5 text-secondary-foreground/80"/>Associated Agency</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Name:</span> <Badge variant="secondary">{associatedAgency.name}</Badge></p>
                  {associatedAgency.mainAddress && (
                    <div className="pt-1">
                      <p className="font-medium text-foreground flex items-center mb-1"><MapPin className="mr-1.5 h-4 w-4 text-secondary-foreground/70"/>Main Address:</p>
                      <address className="pl-5 not-italic text-xs space-y-0.5">
                        <span>{associatedAgency.mainAddress.street}</span><br/>
                        <span>{associatedAgency.mainAddress.city}{associatedAgency.mainAddress.stateProvince ? `, ${associatedAgency.mainAddress.stateProvince}` : ""}, {associatedAgency.mainAddress.postalCode}</span><br/>
                        <span>{getCountryName(associatedAgency.mainAddress.countryId)}</span>
                      </address>
                    </div>
                  )}
                  {associatedAgency.contactEmail && <p className="flex items-center pt-1"><Mail className="mr-2 h-4 w-4 text-secondary-foreground/70"/>{associatedAgency.contactEmail}</p>}
                  {associatedAgency.contactPhone && <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-secondary-foreground/70"/>{associatedAgency.contactPhone}</p>}
                   {associatedAgency.preferredCurrency && <p className="flex items-center"><Globe className="mr-2 h-4 w-4 text-secondary-foreground/70"/>Preferred Currency: {associatedAgency.preferredCurrency}</p>}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
