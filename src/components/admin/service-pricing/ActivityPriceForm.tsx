
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import type { ActivityPackageDefinition, CurrencyCode } from '@/types/itinerary';
import { PlusCircle, XIcon, Package as PackageIcon, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateGUID } from '@/lib/utils';
import { ActivityPackageScheduler } from '@/components/itinerary/items/activity-package-scheduler';
import { useToast } from "@/hooks/use-toast";
import { parseActivityText } from '@/ai/flows/parse-activity-text-flow';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';

interface ActivityPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function ActivityPriceForm({ form }: ActivityPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [availableActivityServices, setAvailableActivityServices] = React.useState<any[]>([]);

  const currency = form.watch('currency') as CurrencyCode || 'THB';
  const province = form.watch('province');
  const activityNameForLegend = form.watch('name');

  const { fields: activityPackageFields, append: appendActivityPackage, remove: removeActivityPackage, replace: replaceActivityPackages } = useFieldArray({
    control: form.control, name: "activityPackages", keyName: "packageFieldId"
  });

  const [aiInputText, setAiInputText] = React.useState("");
  const [isParsingWithAI, setIsParsingWithAI] = React.useState(false);
  const [aiParseError, setAiParseError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('activity').filter(s => s.currency === currency);
      let filteredServices = allCategoryServices;
      if (province) {
        filteredServices = allCategoryServices.filter(s => s.province === province || !s.province);
      }
      setAvailableActivityServices(filteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, province, form]);

  const handlePredefinedServiceSelect = (serviceId: string) => {
    setAiInputText("");
    setAiParseError(null);
    if (serviceId === "none") {
      form.setValue('selectedServicePriceId', undefined);
      // Keep existing packages or add a default one if none exist
      if (!form.getValues('activityPackages') || form.getValues('activityPackages').length === 0) {
        replaceActivityPackages([{
          id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
          validityStartDate: new Date().toISOString().split('T')[0],
          validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          closedWeekdays: [], specificClosedDates: []
        }]);
      }
    } else {
      const service = getServicePriceById(serviceId);
      if (service) {
        form.setValue('name', form.getValues('name') === "New activity" || !form.getValues('name') || !form.getValues('selectedServicePriceId') ? service.name : form.getValues('name'));
        form.setValue('selectedServicePriceId', service.id);
        if (service.activityPackages && service.activityPackages.length > 0) {
          replaceActivityPackages(service.activityPackages.map(pkg => ({...pkg, id: pkg.id || generateGUID()})));
        } else {
           replaceActivityPackages([{
            id: generateGUID(), name: 'Standard Package', price1: service.price1 || 0, price2: service.price2, notes: service.notes || '',
            validityStartDate: new Date().toISOString().split('T')[0],
            validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            closedWeekdays: [], specificClosedDates: []
          }]);
        }
      }
    }
  };

  const selectedServicePriceId = form.watch('selectedServicePriceId');
  const selectedServiceName = selectedServicePriceId ? getServicePriceById(selectedServicePriceId)?.name : null;

  const handleParseActivityTextWithAI = async () => {
    if (!aiInputText.trim()) {
      setAiParseError("Please paste some activity description text.");
      return;
    }
    setIsParsingWithAI(true);
    setAiParseError(null);
    try {
      const result = await parseActivityText({ activityText: aiInputText });

      const currentName = form.getValues('name');
      if (result.activityName && (currentName === "New activity" || !currentName || !form.getValues('selectedServicePriceId'))) {
        form.setValue('name', result.activityName, { shouldValidate: true });
      }
      if (result.province && !form.getValues('province')) {
        form.setValue('province', result.province, { shouldValidate: true });
      }
      
      const aiPackages = result.parsedPackages || [];
      if (aiPackages.length > 0) {
        const newFormPackages: ActivityPackageDefinition[] = aiPackages.map((p, index) => ({
          id: generateGUID(),
          name: p.packageName || `Parsed Package ${index + 1}`,
          price1: p.adultPrice ?? 0,
          price2: p.childPrice,
          notes: p.notes || '',
          validityStartDate: new Date().toISOString().split('T')[0], // Default validity, can be refined later
          validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          closedWeekdays: [], // AI currently doesn't parse scheduling
          specificClosedDates: [], // AI currently doesn't parse scheduling
        }));
        replaceActivityPackages(newFormPackages);
        if (aiPackages[0]?.currency && aiPackages[0].currency !== form.getValues('currency')) {
            form.setValue('currency', aiPackages[0].currency, { shouldValidate: true });
        }
        toast({ title: "AI Parsing Successful", description: `${aiPackages.length} package(s) prefilled.` });
      } else {
        toast({ title: "AI Parsing Note", description: "No distinct packages found by AI. Check the text or fill manually." });
      }
      
      form.setValue('selectedServicePriceId', undefined);
      setAiInputText("");

    } catch (error: any) {
      console.error("AI Parsing Error:", error);
      setAiParseError(`Failed to parse with AI: ${error.message || "Unknown error"}`);
      toast({ title: "AI Parsing Error", description: error.message || "Could not parse text.", variant: "destructive" });
    } finally {
      setIsParsingWithAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md p-4 relative mt-6">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
          <Sparkles className="inline-block mr-2 h-4 w-4 text-accent" /> AI Activity Data Parser (Optional)
        </p>
        <div className="space-y-3 pt-3">
          <div>
            <Label htmlFor="ai-activity-text-input">
              Paste Activity Description (Can include multiple packages)
            </Label>
            <Textarea
              id="ai-activity-text-input"
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder="e.g., Bangkok City Tour. Option 1: Half day, 9am-1pm. Adult 1200 THB. Option 2: Full day with lunch. Adult 2000 THB, Child 1500 THB..."
              rows={5}
              className="mt-1"
            />
          </div>

          {aiParseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{aiParseError}</AlertDescription>
            </Alert>
          )}
          {isParsingWithAI && (
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <AlertTitle className="text-blue-700">AI Processing...</AlertTitle>
                  <AlertDescription className="text-blue-600">Extracting activity details. This may take a moment.</AlertDescription>
              </Alert>
          )}

          <Button
            type="button"
            onClick={handleParseActivityTextWithAI}
            disabled={isParsingWithAI || !aiInputText.trim()}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isParsingWithAI ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Parse with AI & Prefill Packages
          </Button>
        </div>
      </div>

       {availableActivityServices.length > 0 && (
        <div className="border border-border rounded-md p-4 relative">
          <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Services</p>
          <ShadcnFormField
            control={form.control}
            name="selectedServicePriceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Predefined Activity ({province || 'Any Province'})</FormLabel>
                <Select
                  onValueChange={(value) => handlePredefinedServiceSelect(value)}
                  value={field.value || "none"}
                  disabled={isLoadingServices}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose activity..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Custom Package/Price)</SelectItem>
                    {availableActivityServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || 'Generic'}) - {service.activityPackages?.length ? `${service.activityPackages.length} pkg(s)` : `${currency} ${service.price1 || 0}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}</p>}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      <div className="border border-border rounded-md p-4 mt-6 relative">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
          <PackageIcon className="h-4 w-4 mr-1 text-indigo-500" /> Activity Packages for: {activityNameForLegend || "New Activity"}
        </p>
        <div id="activityPackagesContainer" className="space-y-4 pt-2">
          {activityPackageFields.map((packageField, packageIndex) => {
            const currentPackageValues = form.watch(`activityPackages.${packageIndex}`);
            const packageLegend = currentPackageValues?.name || `Package ${packageIndex + 1}`;
            return (
              <div key={packageField.packageFieldId} className="border border-muted rounded-md p-4 pt-6 relative bg-card shadow-sm">
                 <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate"> {packageLegend} </p>
                <Button type="button" variant="ghost" size="icon" onClick={() => activityPackageFields.length > 1 ? removeActivityPackage(packageIndex) : null} disabled={activityPackageFields.length <= 1} className="absolute top-1 right-1 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80 disabled:opacity-50">
                  <XIcon size={16} />
                </Button>
                <div className="space-y-3 pt-2">
                  <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Package Name</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise, Full Day Tour" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.price1`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Adult Price ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                    <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.price2`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Child Price ({currency}) (Optional)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.notes`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Package Notes/Details</FormLabel><FormControl><Textarea placeholder="Inclusions, duration, what to bring, etc." {...field} value={field.value || ''} rows={2} /></FormControl><FormMessage /></FormItem> )} />
                  <Controller
                    control={form.control}
                    name={`activityPackages.${packageIndex}`}
                    render={({ field: { onChange, value }}) => (
                      <ActivityPackageScheduler
                        packageId={packageField.id} 
                        initialSchedulingData={{
                          validityStartDate: value.validityStartDate,
                          validityEndDate: value.validityEndDate,
                          closedWeekdays: value.closedWeekdays,
                          specificClosedDates: value.specificClosedDates,
                        }}
                        onSchedulingChange={(newSchedule) => { onChange({ ...value, ...newSchedule }); }}
                      />
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="outline" onClick={() => appendActivityPackage({ id: generateGUID(), name: `Package ${activityPackageFields.length + 1}`, price1: 0, price2: undefined, notes: '', validityStartDate: new Date().toISOString().split('T')[0], validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }, { shouldFocus: false })} className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Package
        </Button>
        {(form.formState.errors.activityPackages as any)?.message && ( <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.activityPackages as any).message}</FormMessage> )}
        {form.formState.errors.activityPackages?.root?.message && ( <FormMessage className="mt-2 text-sm text-destructive">{form.formState.errors.activityPackages.root.message}</FormMessage> )}
      </div>
       {(form.formState.errors.price1 as any)?.message && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 rounded-md mt-2">
          <FormMessage className="text-destructive">
            If no packages are defined, ensure a "Default Adult Price" is provided. Error: {(form.formState.errors.price1 as any).message}
          </FormMessage>
        </div>
      )}
    </div>
  );
}
