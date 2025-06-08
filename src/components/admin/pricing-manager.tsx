
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Home, MapPinned, Loader2, LayoutDashboard, ListPlus, FileText, Sparkles, Image as ImageIcon, ClipboardPaste } from 'lucide-react';
import type { ServicePriceItem, SeasonalRate } from '@/types/itinerary'; // Added SeasonalRate
import { VEHICLE_TYPES } from '@/types/itinerary'; 
import { ServicePriceForm } from './service-price-form';
import { ServicePriceTable } from './service-price-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePrices } from '@/hooks/useServicePrices';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { extractContractData } from '@/ai/flows/extract-contract-data-flow';
import { describeImage } from '@/ai/flows/describe-image-flow';
import type { AIContractDataOutput } from '@/types/ai-contract-schemas'; // Simplified import
import { ExtractContractDataInputSchema } from '@/types/ai-contract-schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ZodError } from 'zod';
import NextImage from 'next/image'; // Renamed to avoid conflict with Lucide icon

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export function PricingManager() {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const [currentServicePrices, setCurrentServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServicePriceItem | undefined>(undefined);
  
  const [isContractImportOpen, setIsContractImportOpen] = React.useState(false);
  const [contractText, setContractText] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [uploadedFilePreviewUrl, setUploadedFilePreviewUrl] = React.useState<string | null>(null);
  const [pastedImagePreviewUrl, setPastedImagePreviewUrl] = React.useState<string | null>(null);
  const [isImageSource, setIsImageSource] = React.useState(false); 

  const [isParsingContract, setIsParsingContract] = React.useState(false);
  const [contractParseError, setContractParseError] = React.useState<string | null>(null);
  const [parsingStatusMessage, setParsingStatusMessage] = React.useState<string>("");

  const { toast } = useToast();
  const pasteAreaRef = React.useRef<HTMLDivElement>(null);

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
    if (editingService && editingService.id) { 
      updatedPrices = currentServicePrices.map(sp => sp.id === editingService.id ? { ...editingService, ...data } : sp);
      toast({ title: "Success", description: `Service price "${data.name}" updated.` });
    } else { 
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

  const resetImportDialogState = () => {
    setContractText("");
    setUploadedFile(null);
    setUploadedFilePreviewUrl(null);
    setPastedImagePreviewUrl(null);
    setIsImageSource(false);
    setContractParseError(null);
    setParsingStatusMessage("");
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    resetImportDialogState(); 
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
        setContractParseError("File size exceeds 4MB. Please choose a smaller file.");
        return;
      }
      setUploadedFile(file);
      setIsImageSource(file.type.startsWith('image/'));
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setUploadedFilePreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else if (file.type === "text/plain" || file.type === "text/markdown" || file.type === "text/html" || file.type === "application/xml" || file.type === "text/xml") {
        const text = await file.text();
        setContractText(text);
      } else {
        setContractParseError("Unsupported file type. Please upload a text file (.txt, .md, .html, .xml) or an image file (.png, .jpg, .webp).");
        setUploadedFile(null);
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContractText(e.target.value);
    setContractParseError(null);
    if (uploadedFile) setUploadedFile(null);
    if (uploadedFilePreviewUrl) setUploadedFilePreviewUrl(null);
    if (pastedImagePreviewUrl) setPastedImagePreviewUrl(null);
    setIsImageSource(false);
  };

  const handleImagePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (imageFile) {
      event.preventDefault();
      resetImportDialogState(); 

      if (imageFile.size > 4 * 1024 * 1024) { 
        setContractParseError("Pasted image size exceeds 4MB. Please use a smaller image.");
        toast({ title: "Image Too Large", description: "Pasted image exceeds 4MB limit.", variant: "destructive" });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPastedImagePreviewUrl(reader.result as string);
        setIsImageSource(true);
         toast({ title: "Image Pasted", description: "Image ready for parsing."});
      };
      reader.readAsDataURL(imageFile);
    }
  };

  React.useEffect(() => {
    const area = pasteAreaRef.current;
    if (area && isContractImportOpen) { 
      area.addEventListener('paste', handleImagePaste);
      return () => {
        area.removeEventListener('paste', handleImagePaste);
      };
    }
  }, [isContractImportOpen, pasteAreaRef.current]);


  const handleParseContract = async () => {
    setContractParseError(null);
    setIsParsingContract(true);
    let textToParse = contractText;
    let finalDataUriForParsing: string | null = null;

    if (pastedImagePreviewUrl) {
        finalDataUriForParsing = pastedImagePreviewUrl;
    } else if (uploadedFile && isImageSource && uploadedFilePreviewUrl) {
        finalDataUriForParsing = uploadedFilePreviewUrl;
    }
    
    if (finalDataUriForParsing) { 
      setParsingStatusMessage("Extracting text from image...");
      try {
        const ocrResult = await describeImage({ imageDataUri: finalDataUriForParsing });
        textToParse = ocrResult.description;
        if (!textToParse || textToParse.trim().length < 10) { 
          setContractParseError("AI could not extract sufficient text from the image. Please try a clearer image or paste text directly.");
          setIsParsingContract(false);
          return;
        }
        setParsingStatusMessage("Text extracted. Now parsing contract data...");
      } catch (ocrError: any) {
        console.error("OCR Error:", ocrError);
        setContractParseError(`AI OCR Error: ${ocrError.message}`);
        setIsParsingContract(false);
        return;
      }
    } else if (!textToParse.trim()) { 
      setContractParseError("Please paste contract text or upload a text/image file.");
      setIsParsingContract(false);
      return;
    }
    
    setParsingStatusMessage("Parsing contract data...");
    try {
      ExtractContractDataInputSchema.parse({ contractText: textToParse });
    } catch (e) {
      const zodError = e as ZodError;
      setContractParseError(`Input validation error for AI: ${zodError.errors.map(err => err.message).join(', ')}`);
      setIsParsingContract(false);
      return;
    }

    try {
      const extractedData: AIContractDataOutput = await extractContractData({ contractText: textToParse });
      
      const prefillData: Partial<ServicePriceItem> = {
        name: extractedData.name || "",
        province: extractedData.province || undefined, 
        category: extractedData.category || "misc", 
        subCategory: extractedData.subCategory || "",
        price1: extractedData.price1 ?? 0,
        price2: extractedData.price2,
        currency: extractedData.currency || "THB",
        unitDescription: extractedData.unitDescription || "",
        notes: extractedData.notes || "",
        maxPassengers: extractedData.maxPassengers,
        seasonalRates: [], // Initialize as empty array
      };
      
      if (prefillData.category === 'transfer') {
        if (extractedData.transferModeAttempt === 'vehicle') {
          if (extractedData.vehicleTypeAttempt) {
            prefillData.subCategory = extractedData.vehicleTypeAttempt;
          } else if (!prefillData.subCategory || prefillData.subCategory === 'ticket') { 
            prefillData.subCategory = VEHICLE_TYPES[0]; 
          }
        } else if (extractedData.transferModeAttempt === 'ticket') {
           prefillData.subCategory = 'ticket';
        }
      }

      if (prefillData.category === 'hotel' && extractedData.seasonalRates && Array.isArray(extractedData.seasonalRates)) {
        prefillData.seasonalRates = extractedData.seasonalRates
          .map(aiSr => {
            // Validate rate: must be a number and > 0
            if (typeof aiSr.rate !== 'number' || aiSr.rate <= 0) {
              console.warn('AI Seasonal rate skipped due to missing or invalid rate:', aiSr);
              return null;
            }

            let startDate: Date | null = null;
            if (aiSr.startDate && typeof aiSr.startDate === 'string') {
              const parsed = new Date(aiSr.startDate);
              // Check if the date is valid; new Date('invalid_string') results in Invalid Date
              if (!isNaN(parsed.getTime())) {
                startDate = parsed;
              } else {
                console.warn(`AI extracted invalid start date string: ${aiSr.startDate}`);
              }
            } else {
                console.warn(`AI Seasonal rate skipped due to missing or invalid start date string:`, aiSr.startDate);
            }

            let endDate: Date | null = null;
            if (aiSr.endDate && typeof aiSr.endDate === 'string') {
              const parsed = new Date(aiSr.endDate);
              if (!isNaN(parsed.getTime())) {
                endDate = parsed;
              } else {
                console.warn(`AI extracted invalid end date string: ${aiSr.endDate}`);
              }
            } else {
                console.warn(`AI Seasonal rate skipped due to missing or invalid end date string:`, aiSr.endDate);
            }

            if (!startDate || !endDate) {
              return null; // Skip if dates are invalid
            }

            // Ensure end date is not before start date
            if (endDate < startDate) {
              console.warn(`AI extracted end date ${aiSr.endDate} before start date ${aiSr.startDate}. Adjusting end date to 30 days after start.`);
              endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + 30);
            }

            return {
              id: generateGUID(),
              startDate: startDate.toISOString().split('T')[0], // Store as YYYY-MM-DD string for ServicePriceItem
              endDate: endDate.toISOString().split('T')[0],     // Store as YYYY-MM-DD string for ServicePriceItem
              roomRate: aiSr.rate, // Already validated as number > 0
              extraBedRate: undefined, // AI is not prompted to extract this specific field for seasonal rates
            };
          })
          .filter(sr => sr !== null) as SeasonalRate[]; // Filter out nulls and assert type
      } else if (prefillData.category === 'hotel') {
         prefillData.seasonalRates = []; // Ensure it's an empty array if no valid rates extracted
      }


      setEditingService(prefillData as ServicePriceItem); 
      setIsContractImportOpen(false);
      setIsFormOpen(true); 
      resetImportDialogState();
      toast({ title: "Contract Parsed", description: "Review and complete the service details." });
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
          <Dialog open={isContractImportOpen} onOpenChange={(isOpen) => {
            setIsContractImportOpen(isOpen);
            if (!isOpen) resetImportDialogState(); 
          }}>
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
                  <Label htmlFor="contract-file-upload">Upload Contract File (Text or Image)</Label>
                  <Input 
                    id="contract-file-upload" 
                    type="file" 
                    accept=".txt,.md,.html,.xml,text/plain,text/markdown,text/html,application/xml,text/xml,image/png,image/jpeg,image/webp" 
                    onChange={handleFileChange} 
                    className="mt-1"
                  />
                </div>

                <div 
                  ref={pasteAreaRef}
                  tabIndex={0} 
                  className="mt-2 p-4 border-2 border-dashed border-muted-foreground/30 rounded-md text-center cursor-pointer hover:border-primary"
                  title="Click or focus and then paste an image (Ctrl+V or Cmd+V)"
                >
                  <ClipboardPaste className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Or click here &amp; paste contract image (Ctrl+V / Cmd+V)</p>
                </div>

                {(uploadedFilePreviewUrl || pastedImagePreviewUrl) && (
                  <div className="mt-4 border border-muted-foreground/50 p-2 rounded-md">
                    <NextImage
                      src={uploadedFilePreviewUrl || pastedImagePreviewUrl || ""}
                      alt="Contract preview"
                      width={500}
                      height={300}
                      className="rounded-md object-contain max-h-[200px] w-full"
                    />
                  </div>
                )}
                
                <div className="relative">
                   <div className="absolute inset-0 flex items-center">
                     <span className="w-full border-t" />
                   </div>
                   <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-background px-2 text-muted-foreground">
                       Or
                     </span>
                   </div>
                </div>

                <div>
                  <Label htmlFor="contract-text-input">Paste Contract Text</Label>
                  <Textarea
                    id="contract-text-input"
                    value={contractText}
                    onChange={handleTextareaChange}
                    placeholder="Paste the full text of the service contract here..."
                    rows={8}
                    className="mt-1"
                  />
                </div>
                {contractParseError && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{contractParseError}</AlertDescription>
                  </Alert>
                )}
                {isParsingContract && parsingStatusMessage && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <AlertTitle className="text-blue-700">Processing...</AlertTitle>
                        <AlertDescription className="text-blue-600">{parsingStatusMessage}</AlertDescription>
                    </Alert>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button 
                    onClick={handleParseContract} 
                    disabled={isParsingContract || (!contractText.trim() && !uploadedFile && !pastedImagePreviewUrl)} 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
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
                key={editingService?.id || JSON.stringify(editingService) || 'new'} 
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

    