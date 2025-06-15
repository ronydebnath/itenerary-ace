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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation';
import { LayoutDashboard, ClipboardList, Search, FileText, Eye, Edit2, CheckCircle2, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useCountries } from '@/hooks/useCountries';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';
const PLACEHOLDER_AGENT_ID = "agent_default_user"; // Same as in quotation-request-form.tsx

export default function MyQuotationRequestsPage() {
  const [myRequests, setMyRequests] = React.useState<QuotationRequest[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { countries, isLoading: isLoadingCountries } = useCountries();

  const [isRevisionModalOpen, setIsRevisionModalOpen] = React.useState(false);
  const [revisionNotes, setRevisionNotes] = React.useState("");
  const [currentRequestForRevision, setCurrentRequestForRevision] = React.useState<QuotationRequest | null>(null);


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

  const updateRequestInLocalStorage = (updatedRequest: QuotationRequest) => {
    const updatedRequestsList = myRequests.map(req =>
      req.id === updatedRequest.id ? updatedRequest : req
    );
    // Update the full list in localStorage, not just the agent's
    const allStoredRequestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
    const allStoredRequests: QuotationRequest[] = allStoredRequestsString ? JSON.parse(allStoredRequestsString) : [];
    const indexInAll = allStoredRequests.findIndex(r => r.id === updatedRequest.id);
    if (indexInAll > -1) {
      allStoredRequests[indexInAll] = updatedRequest;
      localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allStoredRequests));
    }
    setMyRequests(updatedRequestsList); // Update local state for immediate UI refresh
  };

  const handleRequestRevision = (request: QuotationRequest) => {
    setCurrentRequestForRevision(request);
    setRevisionNotes(request.agentRevisionNotes || "");
    setIsRevisionModalOpen(true);
  };

  const submitRevisionRequest = () => {
    if (currentRequestForRevision) {
      const updatedRequest = {
        ...currentRequestForRevision,
        status: "Quoted: Revision Requested" as QuotationRequestStatus,
        agentRevisionNotes: revisionNotes,
        version: (currentRequestForRevision.version || 1) + 0.1, // Increment version for revision
        updatedAt: new Date().toISOString(),
      };
      updateRequestInLocalStorage(updatedRequest);
      toast({ title: "Revision Requested", description: `Your notes for Quotation ID ${currentRequestForRevision.id.slice(-6)} have been sent to the admin.` });
      setIsRevisionModalOpen(false);
      setRevisionNotes("");
      setCurrentRequestForRevision(null);
    }
  };

  const handleMarkAsReadyForApproval = (request: QuotationRequest) => {
     const updatedRequest = {
        ...request,
        status: "Quoted: Awaiting TA Approval" as QuotationRequestStatus,
        updatedAt: new Date().toISOString(),
      };
      updateRequestInLocalStorage(updatedRequest);
      toast({ title: "Marked for Approval", description: `Quotation ID ${request.id.slice(-6)} is now awaiting final admin approval.` });
  };

  const handleApproveQuotation = (request: QuotationRequest) => {
     const updatedRequest = {
        ...request,
        status: "Confirmed" as QuotationRequestStatus,
        updatedAt: new Date().toISOString(),
      };
      updateRequestInLocalStorage(updatedRequest);
      toast({ title: "Quotation Approved!", description: `Quotation ID ${request.id.slice(-6)} has been confirmed.` });
  };


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
      case 'New Request Submitted': return 'bg-[hsl(var(--status-new-request-bg))] text-[hsl(var(--status-new-request-text))] border-[hsl(var(--status-new-request-border))] dark:bg-[hsl(var(--status-new-request-bg))] dark:text-[hsl(var(--status-new-request-text))] dark:border-[hsl(var(--status-new-request-border))]';
      case 'Quoted: Revision In Progress': return 'bg-[hsl(var(--status-revision-progress-bg))] text-[hsl(var(--status-revision-progress-text))] border-[hsl(var(--status-revision-progress-border))] dark:bg-[hsl(var(--status-revision-progress-bg))] dark:text-[hsl(var(--status-revision-progress-text))] dark:border-[hsl(var(--status-revision-progress-border))]';
      case 'Quoted: Waiting for TA Feedback': return 'bg-[hsl(var(--status-waiting-feedback-bg))] text-[hsl(var(--status-waiting-feedback-text))] border-[hsl(var(--status-waiting-feedback-border))] dark:bg-[hsl(var(--status-waiting-feedback-bg))] dark:text-[hsl(var(--status-waiting-feedback-text))] dark:border-[hsl(var(--status-waiting-feedback-border))]';
      case 'Quoted: Revision Requested': return 'bg-[hsl(var(--status-revision-requested-bg))] text-[hsl(var(--status-revision-requested-text))] border-[hsl(var(--status-revision-requested-border))] dark:bg-[hsl(var(--status-revision-requested-bg))] dark:text-[hsl(var(--status-revision-requested-text))] dark:border-[hsl(var(--status-revision-requested-border))]';
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


  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen p-4">Loading your quotation requests...</div>;
  }

  const agentCanViewProposal = (status: QuotationRequestStatus) => {
    return [
      "Quoted: Waiting for TA Feedback",
      "Quoted: Re-quoted",
      "Quoted: Awaiting TA Approval",
      "Confirmed",
      "Deposit Pending", "Booked", "Documents Sent", "Trip In Progress", "Completed"
    ].includes(status);
  };


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
                  <TableHead className="px-2 py-3 text-xs sm:text-sm w-[100px] sm:w-[120px]">Req. ID</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Destinations</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm">Pax</TableHead>
                  <TableHead className="px-2 py-3 text-xs sm:text-sm text-center">Status & Notes</TableHead>
                  <TableHead className="text-center w-[220px] sm:w-[280px] px-2 py-3 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="text-xs sm:text-sm">
                    <TableCell className="font-mono py-2 px-2 text-xs truncate max-w-[80px] sm:max-w-none">{req.id.slice(-11)}</TableCell>
                    <TableCell className="py-2 px-2">{format(parseISO(req.requestDate), 'dd MMM yy')}</TableCell>
                    <TableCell className="py-2 px-2">
                      {getCountryNames(req.tripDetails.preferredCountryIds)}
                      {(req.tripDetails.preferredProvinceNames || []).length > 0 && (
                        <span className="text-muted-foreground text-xs block"> ({req.tripDetails.preferredProvinceNames!.join(', ')})</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 px-2">{req.clientInfo.adults}A {req.clientInfo.children > 0 && ` ${req.clientInfo.children}C`}</TableCell>
                    <TableCell className="py-2 px-2 text-center">
                        <Badge variant="outline" className={cn("text-xs px-2 py-0.5 whitespace-nowrap", getStatusBadgeClassName(req.status))}>
                            {req.status} {req.version && req.version > 0 ? `(v${req.version.toFixed(1)})` : ''}
                        </Badge>
                         {(req.adminRevisionNotes && ["Quoted: Waiting for TA Feedback", "Quoted: Re-quoted"].includes(req.status)) || (req.agentRevisionNotes && ["Quoted: Revision Requested", "Quoted: Revision In Progress"].includes(req.status)) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-blue-500">
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-xs p-2 shadow-lg bg-background border">
                                {req.adminRevisionNotes && ["Quoted: Waiting for TA Feedback", "Quoted: Re-quoted"].includes(req.status) && (
                                  <div className="mb-1">
                                    <p className="font-semibold text-primary">Admin Notes:</p>
                                    <p className="whitespace-pre-wrap text-muted-foreground">{req.adminRevisionNotes}</p>
                                  </div>
                                )}
                                {req.agentRevisionNotes && ["Quoted: Revision Requested", "Quoted: Revision In Progress"].includes(req.status) && (
                                  <div>
                                    <p className="font-semibold text-accent">Your Last Revision Request:</p>
                                    <p className="whitespace-pre-wrap text-muted-foreground">{req.agentRevisionNotes}</p>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : null}
                    </TableCell>
                    <TableCell className="text-center py-2 px-2 space-x-1">
                       {agentCanViewProposal(req.status) && req.linkedItineraryId ? (
                        <Button
                          variant="outline" size="xs"
                          onClick={() => router.push(`/itinerary/view/${req.linkedItineraryId}`)}
                          className="text-xs h-7 px-2" title="View Proposal"
                        >
                          <Eye className="h-3 w-3 mr-1"/> View Proposal
                        </Button>
                      ) : (
                         <Badge variant="secondary" className="text-xs text-muted-foreground px-2 py-1">Awaiting Admin</Badge>
                      )}

                      {(req.status === "Quoted: Waiting for TA Feedback" || req.status === "Quoted: Re-quoted") && (
                        <>
                          <Button variant="outline" size="xs" onClick={() => handleRequestRevision(req)} className="text-xs h-7 px-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                            <Edit2 className="h-3 w-3 mr-1" /> Request Revision
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => handleMarkAsReadyForApproval(req)} className="text-xs h-7 px-2 border-sky-500 text-sky-600 hover:bg-sky-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Ready for Approval
                          </Button>
                        </>
                      )}
                       {req.status === "Quoted: Awaiting TA Approval" && (
                         <>
                           <Button variant="default" size="xs" onClick={() => handleApproveQuotation(req)} className="text-xs h-7 px-2 bg-green-600 hover:bg-green-700">
                             <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                           </Button>
                            <Button variant="outline" size="xs" onClick={() => handleRequestRevision(req)} className="text-xs h-7 px-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                                <Edit2 className="h-3 w-3 mr-1" /> Further Revision
                            </Button>
                         </>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision for Quotation ID: {currentRequestForRevision?.id.slice(-6)}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="revision-notes">Your Notes for Admin:</Label>
            <Textarea
              id="revision-notes"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Please specify the changes you'd like, e.g., 'Change hotel in Bangkok to 5-star', 'Add a day trip to Ayutthaya', etc."
              rows={5}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={submitRevisionRequest} disabled={!revisionNotes.trim()}>Send Revision Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
