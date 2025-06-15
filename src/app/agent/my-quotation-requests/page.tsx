/**
 * @fileoverview This page allows travel agents to view their submitted quotation requests.
 * It lists requests filtered by the agent's ID (placeholder for actual login), showing key details,
 * current status, and provides a link to view any associated itinerary proposal.
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { QuotationRequest } from '@/types/quotation';
import { LayoutDashboard, ClipboardList, Search, FileText, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useCountries } from '@/hooks/useCountries';
import { cn } from '@/lib/utils';

const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';
const PLACEHOLDER_AGENT_ID = "agent_default_user"; // Same as in quotation-request-form.tsx

export default function MyQuotationRequestsPage() {
  const [myRequests, setMyRequests] = React.useState<QuotationRequest[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { countries, isLoading: isLoadingCountries } = useCountries();

  const loadMyRequests = React.useCallback(() => {
    setIsLoading(true);
    try {
      const storedRequests = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
      if (storedRequests) {
        const parsedRequests: QuotationRequest[] = JSON.parse(storedRequests);
        const agentSpecificRequests = parsedRequests.filter(req => req.agentId === PLACEHOLDER_AGENT_ID);
        agentSpecificRequests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
        setMyRequests(agentSpecificRequests);
      } else {
        setMyRequests([]);
      }
    } catch (error) {
      console.error("Error loading my quotation requests:", error);
      toast({ title: "Error", description: "Could not load your quotation requests.", variant: "destructive" });
      setMyRequests([]);
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  const getCountryNames = (countryIds: string[] = []) => {
    if (isLoadingCountries) return "Loading countries...";
    return countryIds.map(id => countries.find(c => c.id === id)?.name || id).join(', ') || 'Any';
  };

  const filteredRequests = myRequests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const destinations = (getCountryNames(req.tripDetails.preferredCountryIds) + " " + (req.tripDetails.preferredProvinceNames || []).join(" ")).toLowerCase();
    return (
      req.id.toLowerCase().includes(searchLower) ||
      destinations.includes(searchLower) ||
      req.status.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadgeClassName = (status: QuotationRequest['status']): string => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'Quoted': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'ConfirmedByAgent': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'BookingInProgress': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'Booked': return 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen p-4">Loading your quotation requests...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
      <div className="container mx-auto py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2">
             <Link href="/agent">
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary flex items-center">
              <ClipboardList className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> My Quotation Requests
            </h1>
          </div>
        </div>

        <div className="mb-4 md:mb-6">
            <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by ID, Destination, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 w-full md:w-2/3 lg:w-1/2 text-sm sm:text-base h-9 sm:h-10"
            />
            </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 sm:py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="mt-3 sm:mt-4 text-muted-foreground text-md sm:text-lg">
              {searchTerm ? "No requests match your search." : "You haven't submitted any quotation requests yet."}
            </p>
            {!searchTerm && (
                <Link href="/agent/quotation-request" passHref className="mt-4 inline-block">
                    <Button>Request a New Quotation</Button>
                </Link>
            )}
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm w-[120px] sm:w-[150px]">Req. ID</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Destinations</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Pax</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm text-center">Status</TableHead>
                  <TableHead className="text-center w-[120px] px-2 py-3 text-xs sm:text-sm">Proposal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="text-xs sm:text-sm">
                    <TableCell className="font-mono py-2 px-2 text-xs truncate max-w-[100px] sm:max-w-none">{req.id}</TableCell>
                    <TableCell className="py-2 px-2">{format(parseISO(req.requestDate), 'dd MMM yy')}</TableCell>
                    <TableCell className="py-2 px-2">
                      {getCountryNames(req.tripDetails.preferredCountryIds)}
                      {(req.tripDetails.preferredProvinceNames || []).length > 0 && (
                        <span className="text-muted-foreground text-xs block"> ({req.tripDetails.preferredProvinceNames!.join(', ')})</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-2">{req.clientInfo.adults}A {req.clientInfo.children > 0 && ` ${req.clientInfo.children}C`}</TableCell>
                    <TableCell className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn("text-xs px-2.5 py-1", getStatusBadgeClassName(req.status))}>
                            {req.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center py-2 px-2">
                      {req.linkedItineraryId ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/planner?itineraryId=${req.linkedItineraryId}&quotationRequestId=${req.id}`)}
                          className="text-xs h-7"
                          title="View Proposal"
                        >
                          <Eye className="h-3 w-3 mr-1"/> View Proposal
                        </Button>
                      ) : req.status === "Pending" || req.status === "Quoted" ? (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Awaiting</Badge>
                      ) : (
                         <Badge variant="secondary" className="text-xs text-muted-foreground">Not Available</Badge>
                      )}
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
