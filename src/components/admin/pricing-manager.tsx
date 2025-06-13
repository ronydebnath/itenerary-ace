
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, LayoutDashboard, MapPinned, Loader2, ListPlus, FileText, Sparkles } from 'lucide-react';
import type { ServicePriceItem, ItineraryItemType } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { ServicePriceTable } from './service-price-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePrices } from '@/hooks/useServicePrices';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { extractContractData } from '@/ai/flows/extract-contract-data-flow';
import type { AIContractDataOutput } from '@/types/ai-contract-schemas';
import { ExtractContractDataInputSchema } from '@/types/ai-contract-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ZodError } from 'zod';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCountries } from '@/hooks/useCountries'; // Import useCountries

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const TEMP_PREFILL_DATA_KEY = 'tempServicePricePrefillData';

const TABS_CONFIG: Array<{ value: ItineraryItemType | 'all', label: string }> = [
    { value: 'all', label: 'All' }, // Shortened for mobile
    { value: 'hotel', label: 'Hotels' },
    { value: 'activity', label: 'Activities' },
    { value: 'transfer', label: 'Transfers' },
    { value: 'meal', label: 'Meals' },
    { value: 'misc', label: 'Misc' }, // Shortened for mobile
];

export function PricingManager() {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { countries, isLoading: isLoadingCountries, getCountryByName } = useCountries(); // Get countries
  const [currentServicePrices, setCurrentServicePrices] = React.useState<ServicePriceItem[]>([]);
  const router = useRouter();

  const [isContractImportOpen, setIsContractImportOpen] = React.useState(false);
  const [contractText, setContractText] = React.useState("");

  const [isParsingContract, setIsParsingContract] = React.useState(false);
  const [contractParseError, setContractParseError] = React.useState<string | null>(null);
  const [parsingStatusMessage, setParsingStatusMessage] = React.useState<string>("");

  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoadingServices) {
      setCurrentServicePrices(allServicePrices);
    }
  }, [allServicePrices, isLoadingServices]);

  const savePricesToLocalStorage = (prices: ServicePriceItem[]) => {
    try {
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(prices));
    } catch (error) {
      console.error("Failed to save service prices to localStorage:", error);
      toast({ title: "Error", description: "Could not save service prices.", variant: "destructive" });
    }
  };

  const handleEditNavigation = (serviceId: string) => {
    router.push(`/admin/pricing/edit/${serviceId}`);
  };

  const handleDelete = (serviceId: string) => {
    const serviceToDelete = currentServicePrices.find(sp => sp.id === serviceId);
    const updatedPrices = currentServicePrices.filter(sp => sp.id !== serviceId);
    setCurrentServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    toast({ title: "Success", description: `Service price "${serviceToDelete?.name || 'Item'}" deleted.` });
  };

  const resetImportDialogState = () => {
    setContractText("");
    setContractParseError(null);
    setParsingStatusMessage("");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContractText(e.target.value);
    setContractParseError(null);
  };

  const handleParseContract = async () => {
    setContractParseError(null);
    setIsParsingContract(true);
    let textToParse = contractText;

    if (!textToParse.trim()) {
      setContractParseError("Please paste contract text.");
      setIsParsingContract(false);
      return;
    }

    setParsingStatusMessage("Validating input...");
    try {
      ExtractContractDataInputSchema.parse({ contractText: textToParse });
    } catch (e) {
      const zodError = e as ZodError;
      setContractParseError(`Input validation error for AI: ${zodError.errors.map(err => err.message).join(', ')}`);
      setIsParsingContract(false);
      return;
    }

    setParsingStatusMessage("Parsing contract data with AI...");
    try {
      const extractedData: AIContractDataOutput = await extractContractData({ contractText: textToParse });
      
      let countryIdForService: string | undefined = undefined;
      if (extractedData.province) { // Try to infer country from province if AI provides one
          const foundCountry = countries.find(country => country.name.toLowerCase() === extractedData.province?.toLowerCase() || country.name.toLowerCase().includes(extractedData.province!.toLowerCase()));
          if (foundCountry) {
             countryIdForService = foundCountry.id;
          } else {
            // If province is mentioned but not a direct country match, check if it's a known province
            const provinceObj = allServicePrices.find(sp => sp.province?.toLowerCase() === extractedData.province?.toLowerCase());
            if (provinceObj?.countryId) countryIdForService = provinceObj.countryId;
          }
      }


      const prefillData: Partial<ServicePriceItem> = {
        name: extractedData.name || "",
        countryId: countryIdForService,
        province: extractedData.province || undefined,
        category: extractedData.category || "misc",
        subCategory: extractedData.subCategory || "",
        currency: extractedData.currency || "THB",
        unitDescription: extractedData.unitDescription || undefined,
        notes: extractedData.notes || "",
        maxPassengers: extractedData.maxPassengers,
      };

      if (prefillData.category === 'hotel') {
        prefillData.hotelDetails = {
          id: generateGUID(),
          name: prefillData.name || "New Hotel",
          countryId: countryIdForService || "", 
          province: prefillData.province || "",
          roomTypes: [{
            id: generateGUID(),
            name: extractedData.subCategory || 'Standard Room',
            extraBedAllowed: typeof extractedData.price2 === 'number' && extractedData.price2 > 0,
            notes: '', characteristics: [],
            seasonalPrices: (extractedData.price1 !== undefined ? [{
                  id: generateGUID(), seasonName: "Imported Season",
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                  rate: extractedData.price1,
                  extraBedRate: extractedData.price2,
                }] : [])
          }]
        };
        prefillData.price1 = undefined;
        prefillData.price2 = undefined;
        prefillData.subCategory = undefined;
      } else if (prefillData.category === 'activity') {
        prefillData.activityPackages = (extractedData.price1 !== undefined) ? [{
          id: generateGUID(),
          name: extractedData.subCategory || 'Standard Package',
          price1: extractedData.price1,
          price2: extractedData.price2,
          notes: '',
          validityStartDate: new Date().toISOString().split('T')[0],
          validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          closedWeekdays: [], specificClosedDates: [],
        }] : [];
        prefillData.price1 = undefined;
        prefillData.price2 = undefined;
        prefillData.subCategory = undefined;
      } else {
        prefillData.price1 = extractedData.price1 ?? 0;
        prefillData.price2 = extractedData.price2;
      }

      if (prefillData.category === 'transfer') {
        if (extractedData.transferModeAttempt === 'vehicle') {
          prefillData.transferMode = 'vehicle';
          if (extractedData.vehicleTypeAttempt) {
            prefillData.subCategory = undefined; // No subcat for vehicle, type is in vehicleOptions
            prefillData.vehicleOptions = [{id: generateGUID(), vehicleType: extractedData.vehicleTypeAttempt, price: prefillData.price1 || 0, maxPassengers: prefillData.maxPassengers || 1, notes: ''}];
          } else if (!prefillData.subCategory || prefillData.subCategory === 'ticket') {
             prefillData.vehicleOptions = [{id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: prefillData.price1 || 0, maxPassengers: prefillData.maxPassengers || 1, notes: ''}];
          }
          prefillData.price1 = undefined; // price is in vehicleOptions
        } else if (extractedData.transferModeAttempt === 'ticket') {
           prefillData.transferMode = 'ticket';
           prefillData.subCategory = 'ticket';
        }
      }

      localStorage.setItem(TEMP_PREFILL_DATA_KEY, JSON.stringify(prefillData));
      setIsContractImportOpen(false);
      resetImportDialogState();
      router.push('/admin/pricing/new');
      toast({ title: "Contract Parsed", description: "Review and complete the service details on the new page." });

    } catch (error: any) {
      console.error("Error parsing contract with AI:", error);
      setContractParseError(`AI Parsing Error: ${error.message}`);
      toast({ title: "AI Parsing Error", description: error.message, variant: "destructive"});
    } finally {
      setIsParsingContract(false);
      setParsingStatusMessage("");
    }
  };


  return (
    <div className="container mx-auto py-6 md:py-8 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center">
             <ListPlus className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Manage Service Prices
          </h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Dialog open={isContractImportOpen} onOpenChange={(isOpen) => {
            setIsContractImportOpen(isOpen);
            if (!isOpen) resetImportDialogState();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent flex-1 sm:flex-none text-xs sm:text-sm h-9 sm:h-10">
                <FileText className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-5 sm:w-5" /> Import (AI)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent"/> Parse Contract with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="contract-text-input" className="text-xs sm:text-sm">Paste Contract Text</Label>
                  <Textarea
                    id="contract-text-input"
                    value={contractText}
                    onChange={handleTextareaChange}
                    placeholder="Paste the full text of the service contract here..."
                    rows={8}
                    className="mt-1 text-sm"
                  />
                </div>
                {contractParseError && (
                  <Alert variant="destructive">
                    <AlertTitle className="text-sm">Error</AlertTitle>
                    <AlertDescription className="text-xs">{contractParseError}</AlertDescription>
                  </Alert>
                )}
                {isParsingContract && parsingStatusMessage && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <AlertTitle className="text-sm text-blue-700">Processing...</AlertTitle>
                        <AlertDescription className="text-xs text-blue-600">{parsingStatusMessage}</AlertDescription>
                    </Alert>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <DialogClose asChild><Button variant="outline" size="sm" className="w-full sm:w-auto">Cancel</Button></DialogClose>
                <Button
                    onClick={handleParseContract}
                    disabled={isParsingContract || !contractText.trim()}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
                    size="sm"
                >
                  {isParsingContract ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Parse with AI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/admin/pricing/new" passHref className="flex-1 sm:flex-none">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full text-xs sm:text-sm h-9 sm:h-10">
              <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-5 sm:w-5" /> Add New
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <Link href="/admin/provinces">
          <Button variant="link" className="text-primary flex items-center p-1 text-xs sm:text-sm">
            <MapPinned className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-5 sm:w-5" /> Manage Provinces
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 h-auto sm:h-10">
            {TABS_CONFIG.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm py-1.5 sm:py-2">{tab.label}</TabsTrigger>
            ))}
        </TabsList>

        {isLoadingServices || isLoadingCountries ? (
          <div className="text-center py-10 col-span-full">
              <Loader2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base">Loading service prices...</p>
          </div>
        ) : (
          TABS_CONFIG.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-0">
              <ServicePriceTable
                servicePrices={tab.value === 'all' ? currentServicePrices : currentServicePrices.filter(sp => sp.category === tab.value)}
                onEdit={handleEditNavigation}
                onDeleteConfirmation={(serviceId) => (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7 sm:h-8 sm:w-8">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the service price.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(serviceId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                displayMode={tab.value as 'all' | ItineraryItemType}
              />
              {(tab.value === 'all' ? currentServicePrices : currentServicePrices.filter(sp => sp.category === tab.value)).length === 0 && (
                 <div className="text-center py-8 sm:py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg mt-4">
                    <p className="text-muted-foreground text-sm sm:text-lg">No services found for "{tab.label}".</p>
                </div>
              )}
            </TabsContent>
          ))
        )}
      </Tabs>

      {currentServicePrices.length === 0 && !isLoadingServices && !isLoadingCountries && (
         <div className="text-center py-8 sm:py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg mt-6">
          <p className="text-muted-foreground text-sm sm:text-lg">No service prices defined yet.</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">Use "Import from Contract" or "Add New Service Price" to add services.</p>
        </div>
      )}

    </div>
  );
}
