/**
 * @fileoverview This page allows an agent (conceptually) to manage their agency's profile
 * and the users (other agents) associated with that agency. It displays the agency's details
 * for editing and lists its users, with functionality to add new users.
 *
 * @bangla এই পৃষ্ঠাটি একজন এজেন্টকে (ধারণাগতভাবে) তাদের এজেন্সির প্রোফাইল এবং সেই এজেন্সির
 * সাথে যুক্ত ব্যবহারকারীদের (অন্যান্য এজেন্টদের) পরিচালনা করতে দেয়। এটি সম্পাদনার জন্য এজেন্সির
 * বিবরণ প্রদর্শন করে এবং এর ব্যবহারকারীদের তালিকাভুক্ত করে, নতুন ব্যবহারকারী যুক্ত করার
 * কার্যকারিতা সহ।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { AgencyForm } from '@/components/admin/agency-form'; // Re-use the admin agency form
import { AgentUserForm } from '@/components/agent/agent-user-form'; // Renamed form for user details
import type { Agency, AgentProfile } from '@/types/agent';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, Building, Users, PlusCircle, Edit, Trash2, LayoutDashboard, Loader2 } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { Separator } from '@/components/ui/separator';

export default function AgencyProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { agencies, agents, isLoading: isLoadingAgentsHook, updateAgency, addAgent, updateAgent, deleteAgent, refreshAgentData } = useAgents();

  const [managingAgency, setManagingAgency] = React.useState<Agency | null>(null);
  const [agencyUsers, setAgencyUsers] = React.useState<AgentProfile[]>([]);
  const [isUserFormOpen, setIsUserFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<AgentProfile | undefined>(undefined);

  React.useEffect(() => {
    refreshAgentData(); // Fetch latest data on mount
  }, [refreshAgentData]);

  React.useEffect(() => {
    if (!isLoadingAgentsHook) {
      // For this agent-facing page, let's assume they manage their primary/first agency.
      // In a real app with auth, this would be determined by the logged-in agent's association.
      if (agencies.length > 0) {
        const firstAgency = agencies[0];
        setManagingAgency(firstAgency);
        setAgencyUsers(agents.filter(agent => agent.agencyId === firstAgency.id));
      } else {
        setManagingAgency(null);
        setAgencyUsers([]);
      }
    }
  }, [agencies, agents, isLoadingAgentsHook]);

  const handleAgencyFormSubmit = (data: Agency) => {
    if (managingAgency) {
      updateAgency({ ...managingAgency, ...data }); // updateAgency should handle ID internally
    }
  };

  const handleUserFormSubmit = (userData: AgentProfile) => {
    if (!managingAgency) {
      toast({ title: "Error", description: "No agency selected to add user to.", variant: "destructive" });
      return;
    }
    if (editingUser) {
      updateAgent({ ...editingUser, ...userData, agencyId: managingAgency.id });
    } else {
      addAgent({ ...userData, agencyId: managingAgency.id });
    }
    setIsUserFormOpen(false);
    setEditingUser(undefined);
  };

  const openEditUserDialog = (user: AgentProfile) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    const userToDelete = agencyUsers.find(u => u.id === userId);
    if (userToDelete) {
        deleteAgent(userId);
        toast({ title: "User Deleted", description: `User "${userToDelete.fullName}" has been removed.` });
    }
  };


  if (isLoadingAgentsHook && !managingAgency) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2"/> Loading agency data...
      </div>
    );
  }

  if (!managingAgency) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-3xl py-8 text-center">
           <Building className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-semibold text-muted-foreground">No Agency Found</h1>
          <p className="text-muted-foreground mt-2">
            It seems there is no agency associated with your account or no agencies are set up in the system.
            Please contact an administrator or set up an agency in the admin panel.
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
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="shadow-xl mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2">
              <Link href="/agent">
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 self-start sm:self-center">
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <div className="text-center sm:text-left flex-grow">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center justify-center sm:justify-start">
                  <Building className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Agency Profile: {managingAgency.name}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Manage your agency's information and details.
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
            <AgencyForm
              key={managingAgency.id} // Re-render if agency changes
              initialData={managingAgency}
              onSubmit={handleAgencyFormSubmit}
              onCancel={() => router.push('/agent')} // Or provide a specific cancel action
            />
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <Card className="shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold text-primary flex items-center">
                        <Users className="mr-2 h-5 w-5" /> Users for {managingAgency.name} ({agencyUsers.length})
                    </CardTitle>
                    <Dialog open={isUserFormOpen} onOpenChange={(open) => { setIsUserFormOpen(open); if (!open) setEditingUser(undefined); }}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'} to {managingAgency.name}</DialogTitle>
                            </DialogHeader>
                            <AgentUserForm
                                key={editingUser?.id || 'new-user'}
                                initialData={editingUser}
                                agencyId={managingAgency.id} // Pass current agency ID
                                onSubmit={handleUserFormSubmit}
                                onCancel={() => { setIsUserFormOpen(false); setEditingUser(undefined); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                <CardDescription>Manage agents and staff associated with this agency.</CardDescription>
            </CardHeader>
            <CardContent>
                {agencyUsers.length > 0 ? (
                    <ul className="space-y-3">
                        {agencyUsers.map(user => (
                            <li key={user.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-muted/50 transition-colors">
                                <div>
                                    <p className="font-medium text-foreground">{user.fullName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                    {user.specializations && <p className="text-xs text-primary/80 italic mt-0.5" title={user.specializations}>Specializes in: {user.specializations.length > 40 ? user.specializations.substring(0, 37) + "..." : user.specializations}</p>}
                                </div>
                                <div className="space-x-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80 hover:bg-primary/10" onClick={() => openEditUserDialog(user)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:bg-destructive/10" onClick={() => handleDeleteUser(user.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No users added to this agency yet.</p>
                )}
            </CardContent>
        </Card>

      </div>
    </main>
  );
}
