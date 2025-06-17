
/**
 * @fileoverview This page component allows administrators to manage saved itineraries.
 * It displays a list of all itineraries stored in localStorage, providing options
 * to search, view, edit (by navigating to the planner page with the specific itinerary ID),
 * and delete them.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের সংরক্ষিত ভ্রমণপথ পরিচালনা করার অনুমতি দেয়।
 * এটি localStorage-এ সংরক্ষিত সমস্ত ভ্রমণপথের একটি তালিকা প্রদর্শন করে, যেখানে অনুসন্ধান,
 * দেখা, সম্পাদনা (নির্দিষ্ট ভ্রমণপথ আইডি সহ পরিকল্পনাকারী পৃষ্ঠায় নেভিগেট করে) এবং
 * মুছে ফেলার বিকল্প সরবরাহ করা হয়।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryMetadata } from '@/types/itinerary';
import { LayoutDashboard, ListOrdered, Edit, Trash2, Search, FileText, Tags, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';

export default function ManageItinerariesPage() {
  const [itineraries, setItineraries] = React.useState<ItineraryMetadata[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [tagFilterInput, setTagFilterInput] = React.useState('');
  const [parsedTagFilters, setParsedTagFilters] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedIndex = localStorage.getItem(ITINERARY_INDEX_KEY);
      if (storedIndex) {
        const parsedIndex: ItineraryMetadata[] = JSON.parse(storedIndex);
        // Ensure tags is always an array for consistent filtering
        const normalizedIndex = parsedIndex.map(it => ({ ...it, tags: Array.isArray(it.tags) ? it.tags : [] }));
        normalizedIndex.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setItineraries(normalizedIndex);
      }
    } catch (error) {
      console.error("Error loading itinerary index:", error);
      toast({ title: "Error", description: "Could not load itineraries.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    const filters = tagFilterInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');
    setParsedTagFilters(filters);
  }, [tagFilterInput]);

  const handleDeleteItinerary = (itineraryId: string) => {
    try {
      const updatedIndex = itineraries.filter(it => it.id !== itineraryId);
      localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(updatedIndex));
      setItineraries(updatedIndex);
      localStorage.removeItem(`${ITINERARY_DATA_PREFIX}${itineraryId}`);
      const lastActiveId = localStorage.getItem('lastActiveItineraryId');
      if (lastActiveId === itineraryId) {
        localStorage.removeItem('lastActiveItineraryId');
      }
      toast({ title: "Success", description: `Itinerary ${itineraryId} deleted.` });
    } catch (error) {
      console.error("Error deleting itinerary:", error);
      toast({ title: "Error", description: "Could not delete itinerary.", variant: "destructive" });
    }
  };

  const filteredItineraries = itineraries.filter(it => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatches = it.itineraryName.toLowerCase().includes(searchLower);
    const idMatches = it.id.toLowerCase().includes(searchLower);
    const clientMatches = it.clientName && it.clientName.toLowerCase().includes(searchLower);

    const searchPasses = nameMatches || idMatches || clientMatches;

    if (!searchPasses) return false;

    if (parsedTagFilters.length > 0) {
      const itineraryTagsLower = (it.tags || []).map(tag => tag.toLowerCase());
      return parsedTagFilters.every(filterTag => itineraryTagsLower.includes(filterTag));
    }
    
    return true;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen p-4">Loading itineraries...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="container mx-auto py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2">
             <Link href="/">
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center">
              <ListOrdered className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Manage Saved Itineraries
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by ID, Itinerary, or Client Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 w-full text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Filter by Tags (comma-separated)..."
                value={tagFilterInput}
                onChange={(e) => setTagFilterInput(e.target.value)}
                className="pl-8 sm:pl-10 w-full text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        {filteredItineraries.length === 0 ? (
          <div className="text-center py-8 sm:py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="mt-3 sm:mt-4 text-muted-foreground text-md sm:text-lg">
              {searchTerm || tagFilterInput ? "No itineraries match your search/filters." : "No itineraries saved yet."}
            </p>
            {!searchTerm && !tagFilterInput && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Create a new itinerary from the Admin Dashboard.</p>}
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-2 sm:px-4 py-3 text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="px-2 sm:px-4 py-3 text-xs sm:text-sm">Itinerary Name</TableHead>
                  <TableHead className="px-2 sm:px-4 py-3 text-xs sm:text-sm hidden md:table-cell">Client Name</TableHead>
                  <TableHead className="px-2 sm:px-4 py-3 text-xs sm:text-sm">Tags</TableHead>
                  <TableHead className="px-2 sm:px-4 py-3 text-xs sm:text-sm">Last Updated</TableHead>
                  <TableHead className="text-center w-[80px] sm:w-[100px] px-2 sm:px-4 py-3 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItineraries.map((it) => (
                  <TableRow key={it.id} className="text-xs sm:text-sm">
                    <TableCell className="font-mono py-2 px-2 sm:px-4 text-xs">{it.id}</TableCell>
                    <TableCell className="font-medium py-2 px-2 sm:px-4">{it.itineraryName}</TableCell>
                    <TableCell className="py-2 px-2 sm:px-4 hidden md:table-cell">{it.clientName || 'N/A'}</TableCell>
                    <TableCell className="py-2 px-2 sm:px-4">
                      <div className="flex flex-wrap gap-1">
                        {(it.tags && it.tags.length > 0) ? it.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                        )) : <span className="text-muted-foreground text-xs italic">No tags</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-2 sm:px-4">{format(new Date(it.updatedAt), 'MMM d, yy HH:mm')}</TableCell>
                    <TableCell className="text-center py-2 px-2 sm:px-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/planner?itineraryId=${it.id}`)}
                        className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"
                        title="Edit Itinerary"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7 sm:h-8 sm:w-8" title="Delete Itinerary">
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete itinerary "{it.itineraryName}" ({it.id}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItinerary(it.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </main>
  );
}

