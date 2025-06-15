/**
 * @fileoverview This page allows administrators to view and manage submitted quotation requests.
 * It lists all requests from localStorage, showing key details and current status.
 * Admins can initiate an itinerary proposal from here, which links the request to the planner.
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation';
import { QUOTATION_STATUSES } from '@/types/quotation';
import { LayoutDashboard, ListChecks, Edit, Trash2, Search, FileText, Eye, FilePlus, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useCountries } from '@/hooks/useCountries';
import { useAgents } from '@/hooks/useAgents'; 
import { cn } from '@/lib/utils';
import { useItineraryManager } from '@/hooks/useItineraryManager'; // Import the hook

const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';

export default function ManageQuotationRequestsPage() {
  const [requests, setRequests] = React.useState<QuotationRequest[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<QuotationRequestStatus | 'all'>('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const { agents, isLoading: isLoadingAgents } = useAgents(); 
  
  useItineraryManager(); 

  const loadRequests = React.useCallback(() => {
    setIsLoading(true);
    try {
      const storedRequests = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
      if (storedRequests) {
        const parsedRequests: QuotationRequest[] = JSON.parse(storedRequests);
        parsedRequests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
        setRequests(parsedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error loading quotation requests:", error);
      toast({ title: "Error", description: "Could not load quotation requests.", variant: "destructive" });
      setRequests([]);
    }
    setIsLoading(false);
  }, [toast]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleUpdateStatus = (requestId: string, newStatus: QuotationRequestStatus) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date().toISOString() } : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(updatedRequests));
    toast({ title: "Status Updated", description: `Request ${requestId.slice(-6)} status changed to ${newStatus}.` });
  };

  const handleDeleteRequest = (requestId: string) => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    setRequests(updatedRequests);
    localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(updatedRequests));
    toast({ title: "Request Deleted", description: `Request ${requestId.slice(-6)} deleted.` });
  };

  const getCountryNames = (countryIds: string[] = []) => {
    if (isLoadingCountries) return "Loading countries...";
    return countryIds.map(id => countries.find(c => c.id === id)?.name || id).join(', ') || 'Any';
  };

  const getAgentName = (agentId?: string) => {
    if (isLoadingAgents || !agentId) return agentId || 'N/A';
    const agent = agents.find(a => a.id === agentId);
    return agent?.fullName || agentId;
  };

  const getStatusBadgeClassName = (status: QuotationRequest['status']): string => {
    // Use HSL variables from globals.css for status colors
    switch (status) {
      case 'New Request Submitted': return 'bg-[hsl(var(--status-new-request-bg))] text-[hsl(var(--status-new-request-text))] border-[hsl(var(--status-new-request-border))] dark:bg-[hsl(var(--status-new-request-bg))] dark:text-[hsl(var(--status-new-request-text))] dark:border-[hsl(var(--status-new-request-border))]';
      case 'Quoted: Waiting for TA Feedback': return 'bg-[hsl(var(--status-waiting-feedback-bg))] text-[hsl(var(--status-waiting-feedback-text))] border-[hsl(var(--status-waiting-feedback-border))] dark:bg-[hsl(var(--status-waiting-feedback-bg))] dark:text-[hsl(var(--status-waiting-feedback-text))] dark:border-[hsl(var(--status-waiting-feedback-border))]';
      case 'Quoted: Revision Requested': return 'bg-[hsl(var(--status-revision-requested-bg))] text-[hsl(var(--status-revision-requested-text))] border-[hsl(var(--status-revision-requested-border))] dark:bg-[hsl(var(--status-revision-requested-bg))] dark:text-[hsl(var(--status-revision-requested-text))] dark:border-[hsl(var(--status-revision-requested-border))]';
      case 'Quoted: Revision In Progress': return 'bg-[hsl(var(--status-revision-progress-bg))] text-[hsl(var(--status-revision-progress-text))] border-[hsl(var(--status-revision-progress-border))] dark:bg-[hsl(var(--status-revision-progress-bg))] dark:text-[hsl(var(--status-revision-progress-text))] dark:border-[hsl(var(--status-revision-progress-border))]';
      case 'Quoted: Re-quoted': return 'bg-[hsl(var(--status-requoted-bg))] text-[hsl(var(--status-requoted-text))] border-[hsl(var(--status-requoted-border))] dark:bg-[hsl(var(--status-requoted-bg))] dark:text-[hsl(var(--status-requoted-text))] dark:border-[hsl(var(--status-requoted-border))]';
      case 'Quoted: Awaiting TA Approval': return 'bg-[hsl(var(--status-awaiting-approval-bg))] text-[hsl(var(--status-awaiting-approval-text))] border-[hsl(var(--status-awaiting-approval-border))] dark:bg-[hsl(var(--status-awaiting-approval-bg))] dark:text-[hsl(var(--status-awaiting-approval-text))] dark:border-[hsl(var(--status-awaiting-approval-border))]';
      case 'Confirmed': return 'bg-[hsl(var(--status-confirmed-bg))] text-[hsl(var(--status-confirmed-text))] border-[hsl(var(--status-confirmed-border))] dark:bg-[hsl(var(--status-confirmed-bg))] dark:text-[hsl(var(--status-confirmed-text))] dark:border-[hsl(var(--status-confirmed-border))]';
      case 'Deposit Pending': return 'bg-[hsl(var(--status-deposit-pending-bg))] text-[hsl(var(--status-deposit-pending-text))] border-[hsl(var(--status-deposit-pending-border))] dark:bg-[hsl(var(--status-deposit-pending-bg))] dark:text-[hsl(var(--status-deposit-pending-text))] dark:border-[hsl(var(--status-deposit-pending-border))]';
      case 'Booked': return 'bg-[hsl(var(--status-booked-bg))] text-[hsl(var(--status-booked-text))] border-[hsl(var(--status-booked-border))] dark:bg-[hsl(var(--status-booked-bg))] dark:text-[hsl(var(--status-booked-text))] dark:border-[hsl(var(--status-booked-border))]';
      case 'Documents Sent': return 'bg-[hsl(var(--status-documents-sent-bg))] text-[hsl(var(--status-documents-sent-text))] border-[hsl(var(--status-documents-sent-border))] dark:bg-[hsl(var(--status-documents-sent-bg))] dark:text-[hsl(var(--status-documents-sent-text))] dark:border-[hsl(var(--status-documents-sent-border))]';
      case 'Trip In Progress': return 'bg-[hsl(var(--status-trip-progress-bg))] text-[hsl(var(--status-trip-progress-text))] border-[hsl(var(--status-trip-progress-border))] dark:bg-[hsl(var(--status-trip-progress-bg))] dark:text-[hsl(var(--status-trip-progress-text))] dark:border-[hsl(var(--status-trip-progress-border))]';
      case 'Completed': return 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed-text))] border-[hsl(var(--status-completed-border))] dark:bg-[hsl(var(--status-completed-bg))] dark:text-[hsl(var(--status-completed-text))] dark:border-[hsl(var(--status-completed-border))]';
      case 'Cancelled': return 'bg-[hsl(var(--status-cancelled-bg))] text-[hsl(var(--status-cancelled-text))] border-[hsl(var(--status-cancelled-border))] dark:bg-[hsl(var(--status-cancelled-bg))] dark:text-[hsl(var(--status-cancelled-text))] dark:border-[hsl(var(--status-cancelled-border))]';
      default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const agentName = getAgentName(req.agentId).toLowerCase();
    const destinations = (getCountryNames(req.tripDetails.preferredCountryIds) + " " + (req.tripDetails.preferredProvinceNames || []).join(" ")).toLowerCase();
    
    const statusMatches = statusFilter === 'all' || req.status === statusFilter;
    const searchMatches = (
      req.id.toLowerCase().includes(searchLower) ||
      agentName.includes(searchLower) ||
      destinations.includes(searchLower) ||
      req.status.toLowerCase().includes(searchLower)
    );
    return statusMatches && searchMatches;
  });

  if (isLoading || isLoadingAgents) { 
    return <div className="flex justify-center items-center min-h-screen p-4">Loading quotation requests...</div>;
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
              <ListChecks className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" /> Manage Quotation Requests
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
            <div className="relative flex-grow">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search ID, Agent, Destination, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 w-full text-sm sm:text-base h-9 sm:h-10"
            />
            </div>
            <div className="relative sm:w-64"> {/* Increased width for longer status names */}
                <Filter className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuotationRequestStatus | 'all')}>
                    <SelectTrigger className="pl-8 sm:pl-10 w-full text-sm sm:text-base h-9 sm:h-10">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {QUOTATION_STATUSES.map(status => (
                            <SelectItem key={status} value={status} className="text-xs">{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 sm:py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            <p className="mt-3 sm:mt-4 text-muted-foreground text-md sm:text-lg">
              {searchTerm || statusFilter !== 'all' ? "No quotation requests match your filters." : "No quotation requests received yet."}
            </p>
            {!searchTerm && statusFilter === 'all' && <p className="text-xs sm:text-sm text-muted-foreground mt-1">Agents can submit requests via their portal.</p>}
          </div>
        ) : (
          <div className="rounded-lg border shadow-sm overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Req. ID</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Agent</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Destinations</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Pax</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-center w-[150px] px-2 py-3 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="text-xs sm:text-sm">
                    <TableCell className="font-mono py-2 px-2 text-xs">{req.id.slice(-11)}</TableCell>
                    <TableCell className="py-2 px-2">{format(parseISO(req.requestDate), 'dd MMM yy')}</TableCell>
                    <TableCell className="font-medium py-2 px-2">{getAgentName(req.agentId)}</TableCell>
                    <TableCell className="py-2 px-2">
                      {getCountryNames(req.tripDetails.preferredCountryIds)}
                      {(req.tripDetails.preferredProvinceNames || []).length > 0 && (
                        <span className="text-muted-foreground text-xs block"> ({req.tripDetails.preferredProvinceNames!.join(', ')})</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-2">{req.clientInfo.adults}A {req.clientInfo.children > 0 && ` ${req.clientInfo.children}C`}</TableCell>
                    <TableCell className="py-2 px-2">
                       <Select value={req.status} onValueChange={(newStatus) => handleUpdateStatus(req.id, newStatus as QuotationRequestStatus)}>
                          <SelectTrigger className={cn("h-8 text-xs w-[180px] sm:w-[200px]", getStatusBadgeClassName(req.status))}> {/* Increased width */}
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUOTATION_STATUSES.map(status => (
                              <SelectItem key={status} value={status} className="text-xs">
                                <Badge variant="outline" className={cn("mr-2 w-full justify-start text-xs", getStatusBadgeClassName(status))}>{status}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-center py-2 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/planner?quotationRequestId=${req.id}${req.linkedItineraryId ? `&itineraryId=${req.linkedItineraryId}` : ''}`)}
                        className="mr-1 text-xs h-7"
                        title={req.linkedItineraryId ? "View/Edit Proposal" : "Create Proposal"}
                      >
                        {req.linkedItineraryId ? <Edit className="h-3 w-3 mr-1"/> : <FilePlus className="h-3 w-3 mr-1"/>}
                        {req.linkedItineraryId ? "Proposal" : "Create"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7" title="Delete Request">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently delete quotation request {req.id.slice(-6)}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRequest(req.id)}
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
