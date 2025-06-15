/**
 * @fileoverview This component provides a form for creating or editing individual user (agent)
 * profiles, typically within the context of an agency. It includes fields for personal information,
 * professional preferences, and contact methods. The agency ID is usually pre-filled.
 *
 * @bangla এই কম্পোনেন্টটি স্বতন্ত্র ব্যবহারকারী (এজেন্ট) প্রোফাইল তৈরি বা সম্পাদনা করার জন্য
 * একটি ফর্ম সরবরাহ করে, সাধারণত একটি এজেন্সির প্রেক্ষাপটে। এটিতে ব্যক্তিগত তথ্য, পেশাগত পছন্দ
 * এবং যোগাযোগের পদ্ধতিগুলির জন্য ক্ষেত্র অন্তর্ভুক্ত রয়েছে। এজেন্সি আইডি সাধারণত প্রি-ফিল করা থাকে।
 */
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { AgentProfileSchema, type AgentProfile } from '@/types/agent';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRENCIES, type CountryItem } from '@/types/itinerary';
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react';

interface AgentUserFormProps {
  initialData?: Partial<AgentProfile>;
  agencyId: string; // Agency this user belongs to, pre-filled
  onSubmit: (data: AgentProfile) => void;
  onCancel: () => void;
}

export function AgentUserForm({
  initialData,
  agencyId,
  onSubmit,
  onCancel,
}: AgentUserFormProps) {

  const form = useForm<AgentProfile>({
    resolver: zodResolver(AgentProfileSchema),
    defaultValues: {
      id: initialData?.id || `agent_${crypto.randomUUID()}`,
      agencyId: agencyId, 
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber || "",
      agencyName: initialData?.agencyName || "", 
      specializations: initialData?.specializations || "",
      yearsOfExperience: initialData?.yearsOfExperience || undefined,
      bio: initialData?.bio || "",
      profilePictureUrl: initialData?.profilePictureUrl || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({ ...initialData, agencyId });
    } else {
      form.reset({ 
        id: `agent_${crypto.randomUUID()}`,
        agencyId: agencyId,
        fullName: "",
        email: "",
        phoneNumber: "",
        agencyName: "",
        specializations: "",
        yearsOfExperience: undefined,
        bio: "",
        profilePictureUrl: "",
      });
    }
  }, [initialData, agencyId, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-h-[calc(100vh-20rem)] sm:max-h-[calc(100vh-18rem)] overflow-y-auto p-1 pr-2">
        <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem> )} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="user@example.com" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phoneNumber" render={({ field }) => (<FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem> )} />
        </div>
        
        <FormField control={form.control} name="agencyName" render={({ field }) => (<FormItem><FormLabel>Specific Office/Branch Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Downtown Branch" {...field} className="h-9 text-sm"/></FormControl><FormDescription className="text-xs">If this user is associated with a specific branch of the main agency.</FormDescription><FormMessage /></FormItem>)} />
        
        <FormField control={form.control} name="specializations" render={({ field }) => (<FormItem><FormLabel>Specializations (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Luxury Travel, Adventure Tours" {...field} rows={2} className="text-sm min-h-[2.25rem]"/></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="yearsOfExperience" render={({ field }) => (<FormItem><FormLabel>Years of Experience (Optional)</FormLabel><FormControl><Input type="number" placeholder="5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="bio" render={({ field }) => (<FormItem><FormLabel>Short Bio (Optional)</FormLabel><FormControl><Textarea placeholder="User's professional background..." {...field} rows={3} className="text-sm min-h-[4.5rem]"/></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="profilePictureUrl" render={({ field }) => (<FormItem><FormLabel>Profile Picture URL (Optional)</FormLabel><FormControl><Input type="url" placeholder="https://example.com/photo.jpg" {...field} className="h-9 text-sm"/></FormControl><FormMessage /></FormItem>)} />
        
        <FormField control={form.control} name="agencyId" render={({ field }) => (<FormItem className="hidden"><FormLabel>Agency ID (Hidden)</FormLabel><FormControl><Input {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />

        <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-card pb-1 border-t -mx-1 px-1">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting} size="sm" className="h-9 text-sm">
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm" disabled={form.formState.isSubmitting} size="sm">
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? 'Update User' : 'Add User'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
