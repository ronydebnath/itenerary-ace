
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ItineraryMetadata } from '@/types/itinerary'; // Assuming ItineraryMetadata is defined
import { Home, ListOrdered, Edit, Trash2, Search, LayoutDashboard, FileText } from 'lucide-react';
import { format } from 'date-fns';

const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';

export default function ManageItinerariesPage() {
  const [itineraries, setItineraries] = React.useState<ItineraryMetadata[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedIndex = localStorage.getItem(ITINERARY_INDEX_KEY);
      if (storedIndex) {
        const parsedIndex: ItineraryMetadata[] = JSON.parse(storedIndex);
        // Sort by updatedAt descending
        parsedIndex.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setItineraries(parsedIndex);
      }
    } catch (error) {
      console.error("Error loading itinerary index:", error);
      toast({ title: "Error", description: "Could not load itineraries.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  const handleDeleteItinerary = (itineraryId: string) => {
    try {
      // Remove from index
      const updatedIndex = itineraries.filter(it => it.id !== itineraryId);
      localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(updatedIndex));
      setItineraries(updatedIndex);

      // Remove itinerary data
      localStorage.removeItem(`${ITINERARY_DATA_PREFIX}${itineraryId}`);

      // Remove from last active if it was the last active
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
    return (
      it.id.toLowerCase().includes(searchLower) ||
      it.itineraryName.toLowerCase().includes(searchLower) ||
      (it.clientName && it.clientName.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading itineraries...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
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
              <ListOrdered className="mr-3 h-8 w-8" /> Manage Saved Itineraries
            </h1>
          </div>
        </div>

        <div className="mb-6">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by ID, Itinerary Name, or Client Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-1/2 lg:w-1/3"
            />
            </div>
        </div>

        {filteredItineraries.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground text-lg">
              {searchTerm ? "No itineraries match your search." : "No itineraries saved yet."}
            </p>
            {!searchTerm && <p className="text-sm text-muted-foreground mt-1">Create a new itinerary from the main page.</p>}
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Itinerary Name</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItineraries.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.id}</TableCell>
                    <TableCell className="font-medium">{it.itineraryName}</TableCell>
                    <TableCell>{it.clientName || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(it.updatedAt), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/?itineraryId=${it.id}`)}
                        className="mr-2 text-primary hover:bg-primary/10"
                        title="Edit Itinerary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Delete Itinerary">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete itinerary "{it.itineraryName}" ({it.id}).
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
