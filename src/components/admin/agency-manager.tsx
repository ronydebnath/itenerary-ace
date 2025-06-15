
/**
 * @fileoverview This component provides the user interface for managing travel agencies
 * and their affiliated agents. It allows users to view a list of existing agencies,
 * add new agencies, edit existing ones, and delete them. For each agency, it displays
 * key details and a list of its agents.
 *
 * @bangla এই কম্পোনেন্টটি ট্রাভেল এজেন্সি এবং তাদের অনুমোদিত এজেন্টদের পরিচালনার জন্য
 * ব্যবহারকারী ইন্টারফেস সরবরাহ করে। এটি ব্যবহারকারীদের বিদ্যমান এজেন্সিগুলির একটি তালিকা
 * দেখতে, নতুন এজেন্সি যুক্ত করতে, বিদ্যমানগুলি সম্পাদনা করতে এবং সেগুলি মুছতে দেয়।
 * প্রতিটি এজেন্সির জন্য, এটি মূল বিবরণ এবং এর এজেন্টদের একটি তালিকা প্রদর্শন করে।
 */
"use client";

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Building, Mail, Phone, MapPin, Edit, Trash2, User, Briefcase, BadgeDollarSign, Star, Users as UsersIcon, Globe } from 'lucide-react';
import type { Agency, AgentProfile } from '@/types/agent';
import { AgencyForm } from './agency-form';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAgents } from '@/hooks/useAgents';
import { useCountries } from '@/hooks/useCountries';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export function AgencyManager() {
  const { agencies, agents, addAgency, updateAgency, deleteAgency, isLoading, refreshAgentData } = useAgents();
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAgency, setEditingAgency] = React.useState<Agency | undefined>(undefined);
  const { toast } = useToast();

  const handleFormSubmit = (data: Omit<Agency, 'id'> & { id?: string }) => {
    if (editingAgency && data.id) {
      updateAgency({ ...editingAgency, ...data, id: data.id });
    } else {
      const { id, ...agencyDataWithoutId } = data; // Remove potentially undefined id for creation
      addAgency(agencyDataWithoutId as Omit<Agency, 'id'>);
    }
    setIsFormOpen(false);
    setEditingAgency(undefined);
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (agencyId: string) => {
    deleteAgency(agencyId);
  };

  const getCountryName = (countryId?: string): string => {
    if (!countryId || isLoadingCountries) return 'N/A';
    return getCountryById(countryId)?.name || 'Unknown Country';
  };

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Loading agency data...</p>;
  }

  return (
    <div className="py-4">
      <div className="flex justify-end items-center mb-6">
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingAgency(undefined);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5"/>{editingAgency ? 'Edit' : 'Add New'} Agency
              </DialogTitle>
            </DialogHeader>
            <AgencyForm
              key={editingAgency?.id || 'new-agency'}
              initialData={editingAgency}
              onSubmit={handleFormSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingAgency(undefined); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {agencies.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground text-lg">No agencies registered yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Click "Add New Agency" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => {
            const affiliatedAgents = agents.filter(agent => agent.agencyId === agency.id);
            return (
              <Card key={agency.id} className="shadow-lg flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold text-primary flex items-center">
                      <Building className="mr-2 h-5 w-5 flex-shrink-0"/>
                      <span className="truncate" title={agency.name}>{agency.name}</span>
                    </CardTitle>
                    <div className="flex-shrink-0 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(agency)} className="h-7 w-7 text-primary/80 hover:bg-primary/10">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                                Delete agency "{agency.name}"? This will also remove its agents. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteConfirm(agency.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                  {agency.mainAddress && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                      <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      {agency.mainAddress.street}, {agency.mainAddress.city}, {getCountryName(agency.mainAddress.countryId)}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1.5 flex-grow">
                    {agency.contactEmail && <p className="flex items-center"><Mail className="h-3 w-3 mr-1.5 flex-shrink-0" /> {agency.contactEmail}</p>}
                    {agency.contactPhone && <p className="flex items-center"><Phone className="h-3 w-3 mr-1.5 flex-shrink-0" /> {agency.contactPhone}</p>}
                    {agency.preferredCurrency && <p className="flex items-center"><BadgeDollarSign className="h-3 w-3 mr-1.5 flex-shrink-0 text-green-600" /> Default Billing: <Badge variant="outline" className="ml-1 border-green-500/50 text-green-700">{agency.preferredCurrency}</Badge></p>}

                    <Separator className="my-2.5" />
                    <h4 className="text-sm font-medium text-foreground/90 flex items-center"><UsersIcon className="mr-1.5 h-4 w-4"/>Affiliated Agents ({affiliatedAgents.length})</h4>
                     {affiliatedAgents.length > 0 ? (
                        <ul className="space-y-1.5 pl-1 max-h-32 overflow-y-auto pr-1">
                            {affiliatedAgents.map(agent => (
                                <li key={agent.id} className="text-xs border-l-2 border-primary/20 pl-2 py-0.5 bg-muted/30 rounded-r-sm">
                                    <p className="font-medium text-primary/90">{agent.fullName}</p>
                                    <p className="text-muted-foreground/80">{agent.email}</p>
                                    {agent.specializations && <p className="text-xs text-muted-foreground/70 italic truncate" title={agent.specializations}>Specializes in: {agent.specializations}</p>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-muted-foreground/70">No agents currently listed.</p>
                    )}
                </CardContent>
                <CardFooter className="pt-3">
                    {/* Future: Button to "Manage Agents" for this specific agency, linking to a more detailed agent management view */}
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto text-primary/80" disabled>View/Manage Agency Agents (Soon)</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

