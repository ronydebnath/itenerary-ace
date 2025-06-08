
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Home, MapPinned, Loader2, LayoutDashboard, ListPlus, FileText, Sparkles } from 'lucide-react';
import type { ServicePriceItem } from '@/types/itinerary';
import { ServicePriceForm } from './service-price-form';
import { ServicePriceTable } from './service-price-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePrices } from '@/hooks/useServicePrices';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { extractContractData, AIContractDataOutput, ExtractContractDataInputSchema } from '@/ai/flows/extract-contract-data-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ZodError } from 'zod';


const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export function PricingManager() {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const [currentServicePrices, setCurrentServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServicePriceItem | undefined>(undefined);
  const [isContractImportOpen, setIsContractImportOpen] = React.useState(false);
  const [contractText, setContractText] = React.useState("");
  const [isParsingContract, setIsParsingContract] = React.useState(false);
  const [contractParseError, setContractParseError] = React.useState<string | null>(null);
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

  const handleFormSubmit = (data: Omit<ServicePriceItem, 'id'>) => {
    let updatedPrices;
    if (editingService && editingService.id) { // Ensure editingService has an ID for update
      updatedPrices = currentServicePrices.map(sp => sp.id === editingService.id ? { ...editingService, ...data } : sp);
      toast({ title: "Success", description: `Service price "${data.name}" updated.` });
    } else { // New service price (could be from AI or fresh)
      const newServicePrice: ServicePriceItem = { ...data, id: generateGUID() };
      updatedPrices = [...currentServicePrices, newServicePrice];
      toast({ title: "Success", description: `Service price "${data.name}" added.` });
    }
    setCurrentServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  const handleEdit = (service: ServicePriceItem) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    const serviceToDelete = currentServicePrices.find(sp => sp.id === serviceId);
    const updatedPrices = currentServicePrices.filter(sp => sp.id !== serviceId);
    setCurrentServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    toast({ title: "Success", description: `Service price "${serviceToDelete?.name || 'Item'}" deleted.` });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain" || file.type === "text/markdown" || file.type === "text/html" || file.type === "application/xml" || file.type === "text/xml") {
        const text = await file.text();
        setContractText(text);
        setContractParseError(null);
      } else {
        setContractParseError("Unsupported file type. Please upload a text-based file (e.g., .txt, .md, .html). PDF and DOCX are not directly supported for text extraction here.");
        setContractText("");
      }
    }
  };

  const handleParseContract = async () => {
    setContractParseError(null);
    if (!contractText.trim()) {
      setContractParseError("Please paste contract text or upload a text file.");
      return;
    }
    try {
      ExtractContractDataInputSchema.parse({ contractText }); // Validate input
    } catch (e) {
      const zodError = e as ZodError;
      setContractParseError(`Input validation error: ${zodError.errors.map(err => err.message).join(', ')}`);
      return;
    }

    setIsParsingContract(true);
    try {
      const extractedData: AIContractDataOutput = await extractContractData({ contractText });
      
      // Transform AI output to ServicePriceItem (or a subset for pre-filling)
      const prefillData: Partial<ServicePriceItem> = {
        name: extractedData.name || "",
        province: extractedData.province || undefined, // "none" or actual
        category: extractedData.category || "misc", // Default category
        subCategory: extractedData.subCategory || "",
        price1: extractedData.price1 ?? 0,
        price2: extractedData.price2,
        currency: extractedData.currency || "THB",
        unitDescription: extractedData.unitDescription || "",
        notes: extractedData.notes || "",
        maxPassengers: extractedData.maxPassengers,
      };
      
      // If AI detected transfer, try to set mode and subCategory appropriately
      if (prefillData.category === 'transfer') {
        if (extractedData.transferModeAttempt === 'vehicle') {
          if (extractedData.vehicleTypeAttempt) {
            prefillData.subCategory = extractedData.vehicleTypeAttempt;
          } else if (!prefillData.subCategory) {
            prefillData.subCategory = VEHICLE_TYPES[0]; // Default vehicle type if none identified
          }
        } else if (extractedData.transferModeAttempt === 'ticket') {
           prefillData.subCategory = 'ticket';
        }
        // price1 would be costPerVehicle or adultTicketPrice
        // price2 would be childTicketPrice
      }


      setEditingService(prefillData as ServicePriceItem); // Cast, knowing ID will be generated on submit if new
      setIsContractImportOpen(false);
      setIsFormOpen(true); // Open the main form pre-filled
      setContractText(""); // Clear textarea
      toast({ title: "Contract Parsed", description: "Review and complete the service details." });
    } catch (error: any) {
      console.error("Error parsing contract with AI:", error);
      setContractParseError(`AI Parsing Error: ${error.message}`);
      toast({ title: "AI Parsing Error", description: error.message, variant: "destructive"});
    } finally {
      setIsParsingContract(false);
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
           <Link href="/admin">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary flex items-center">
             <ListPlus className="mr-3 h-8 w-8" /> Manage Service Prices
          </h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isContractImportOpen} onOpenChange={setIsContractImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
                <FileText className="mr-2 h-5 w-5" /> Import from Contract (AI)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent"/> Parse Contract with AI</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="contract-file-upload">Upload Contract File (text-based: .txt, .md, .html)</Label>
                  <Input id="contract-file-upload" type="file" accept=".txt,.md,.html,.xml,text/plain,text/markdown,text/html,application/xml,text/xml" onChange={handleFileChange} className="mt-1"/>
                  <p className="text-xs text-muted-foreground mt-1">Alternatively, paste content below. PDF/DOCX not directly supported.</p>
                </div>
                <div>
                  <Label htmlFor="contract-text-input">Or Paste Contract Text</Label>
                  <Textarea
                    id="contract-text-input"
                    value={contractText}
                    onChange={(e) => { setContractText(e.target.value); setContractParseError(null); }}
                    placeholder="Paste the full text of the service contract here..."
                    rows={10}
                    className="mt-1"
                  />
                </div>
                {contractParseError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{contractParseError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleParseContract} disabled={isParsingContract || !contractText.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isParsingContract ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Parse with AI
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingService(undefined);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Service Price
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl"> 
              <DialogHeader>
                <DialogTitle>{editingService?.id ? 'Edit' : 'Add'} Service Price {editingService && !editingService.id ? "(from AI)" : ""}</DialogTitle>
              </DialogHeader>
              <ServicePriceForm
                key={editingService?.id || JSON.stringify(editingService) || 'new'} // Ensure re-render for pre-filled data
                initialData={editingService}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingService(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <Link href="/admin/provinces">
          <Button variant="link" className="text-primary flex items-center">
            <MapPinned className="mr-2 h-5 w-5" /> Manage Provinces
          </Button>
        </Link>
      </div>

      {isLoadingServices ? (
        <div className="text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading service prices...</p>
        </div>
      ) : currentServicePrices.length > 0 ? (
        <ServicePriceTable
          servicePrices={currentServicePrices}
          onEdit={handleEdit}
          onDeleteConfirmation={(serviceId) => ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
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
                  <AlertDialogAction onClick={() => handleDelete(serviceId)} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <p className="text-muted-foreground text-lg">No service prices defined yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Demo data should load automatically. If not, please refresh, use "Import from Contract", or click "Add New Service Price".</p>
        </div>
      )}
    </div>
  );
}

