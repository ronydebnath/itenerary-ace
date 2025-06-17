
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, FileLock2, AlertCircle, Eye, EyeOff, BookOpen, Puzzle, Users, Brain, Database } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CORRECT_PASSWORD = "Nick"; // Simple password check

export default function AdminDocumentsPage() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError(null);
      setPasswordInput(''); // Clear password after successful login
    } else {
      setError("Incorrect password. Please try again.");
      setIsAuthenticated(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="absolute top-4 left-4">
        <Link href="/" passHref>
          <Button variant="outline" size="icon">
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Back to Admin Dashboard</span>
          </Button>
        </Link>
      </div>

      {!isAuthenticated ? (
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <FileLock2 className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Secure Document Access</CardTitle>
            <CardDescription>
              This section requires a password to view confidential documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter access password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
                Access Documents
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-3xl">
          <Card className="shadow-xl mb-6">
            <CardHeader className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-primary mb-3" />
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Itinerary Ace - Software Documentation</CardTitle>
              <CardDescription>
                Welcome to the documentation for Itinerary Ace. This section provides an overview of its features and functionalities.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
               <Button onClick={() => {setIsAuthenticated(false); setError(null);}} variant="outline" size="sm" className="mb-6">
                <FileLock2 className="mr-2 h-4 w-4" /> Lock Section
              </Button>
            <Accordion type="multiple" defaultValue={['overview', 'core-features']} className="w-full">
              <AccordionItem value="overview">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                  <div className="flex items-center"><Puzzle className="mr-2 h-5 w-5"/>Overview</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2 pl-2">
                  <p>Itinerary Ace is a comprehensive software solution designed to streamline the creation, management, and costing of travel itineraries. It aims to assist travel agencies and planners in efficiently organizing trips, managing service prices, handling agent requests, and providing clear proposals to clients.</p>
                  <p>The system is built with a focus on usability for both administrative staff and travel agents, incorporating tools to enhance productivity.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="core-features">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                   <div className="flex items-center"><Puzzle className="mr-2 h-5 w-5"/>Core Functionality</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2 pl-2">
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">1. Itinerary Planning & Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Create multi-day itineraries with detailed day-by-day planning.</li>
                      <li>Add various service items: transfers, activities, hotels, meals, and miscellaneous.</li>
                      <li>Manage passenger details (adults, children) and assign them to specific services.</li>
                      <li>Calculate estimated costs for the entire itinerary based on selected services and pricing.</li>
                      <li>Save, load, and manage multiple itineraries. Mark itineraries as templates.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">2. Service Pricing Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Centralized system to define and manage master prices for all services (hotels, activities, transfers, etc.).</li>
                      <li>Support for different pricing structures (e.g., per person, per vehicle, seasonal hotel rates, activity packages).</li>
                      <li>Ability to mark frequently used services as "Favorites" for quick access.</li>
                      <li>AI-assisted contract parsing to help prefill new service price entries.</li>
                    </ul>
                  </Card>
                   <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">3. Agent Quotation System</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Dedicated portal for travel agents to submit detailed quotation requests.</li>
                      <li>Admins can review requests, create itinerary proposals, and send them back to agents.</li>
                      <li>Workflow for revision requests and approvals between admin and agent.</li>
                      <li>Tracks status of quotation requests (e.g., New, Quoted, Confirmed).</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">4. Location Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Manage a list of countries and their default currencies.</li>
                      <li>Define provinces/regions within each country for more granular location-based pricing and planning.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">5. Currency & Exchange Rate Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Manage a list of system and custom currency codes.</li>
                      <li>Define base exchange rates between currencies.</li>
                      <li>Set global and specific-pair markups for currency conversions.</li>
                      <li>Integrated currency converter tool.</li>
                      <li>Option to fetch live rates from an external API (ExchangeRate-API).</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">6. Agency & Agent Profile Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Admins can manage multiple travel agencies and their main details.</li>
                      <li>Agents can manage their individual profiles, including specializations and contact information.</li>
                    </ul>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="user-roles">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                  <div className="flex items-center"><Users className="mr-2 h-5 w-5"/>User Roles & Access</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2 pl-2">
                  <p>The system currently has two primary user roles (managed via demo login credentials):</p>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Admin</h4>
                    <p className="text-xs mt-1">Full access to all system functionalities, including managing master data (service prices, locations, currencies), overseeing agent quotation requests, creating and managing all itineraries, and accessing administrative tools. The Admin Dashboard provides a central point of control.</p>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Agent</h4>
                    <p className="text-xs mt-1">Access to an Agent Portal where they can submit new quotation requests, view the status of their existing requests, review proposals sent by admins, request revisions, approve quotes, and manage their own professional profile. They can also use the Itinerary Planner to draft itineraries (which may then be linked to quotation requests).</p>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-utilities">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                  <div className="flex items-center"><Brain className="mr-2 h-5 w-5"/>AI-Powered Utilities</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2 pl-2">
                  <p>Itinerary Ace incorporates AI to assist with certain tasks (Note: Requires OpenRouter API Key configuration):</p>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">AI Image Describer</h4>
                    <p className="text-xs mt-1">Upload an image, and the AI will provide a textual description of its content. Useful for generating descriptions for marketing materials or itinerary documents.</p>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">AI Contract Parser</h4>
                    <p className="text-xs mt-1">Paste text from a service contract (e.g., hotel or activity supplier agreement), and the AI will attempt to extract key information like service name, category, pricing, and location to prefill the "Add New Service Price" form, speeding up data entry.</p>
                  </Card>
                   <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">AI Activity Package Parser</h4>
                    <p className="text-xs mt-1">Paste a general description of an activity that might include multiple tour options or packages. The AI will attempt to parse out individual packages with their names, prices, and notes to prefill the activity package section when adding a new activity service price.</p>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-management">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                  <div className="flex items-center"><Database className="mr-2 h-5 w-5"/>Data Management</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pt-2 pl-2">
                  <p>Currently, all operational data for Itinerary Ace (including itineraries, service prices, countries, provinces, currencies, agencies, agents, and quotation requests) is stored directly in the **user's web browser using LocalStorage**.</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                    <li>**No Backend Database:** This means the data is local to the browser and device it was created on. Data is not automatically synced across different browsers or devices.</li>
                    <li>**Persistence:** Data will persist as long as the browser's LocalStorage for this site is not cleared.</li>
                    <li>**Backup:** For critical data, consider manual backup methods (e.g., exporting relevant localStorage keys, or in the future, an export feature).</li>
                    <li>**Security:** While convenient for development and standalone use, LocalStorage is not suitable for sensitive data in a multi-user production environment without significant additional security layers.</li>
                  </ul>
                  <p className="mt-2 text-xs">This local storage approach allows the application to function without requiring a dedicated backend server and database, making it easy to deploy and run for demonstration or single-user purposes. For multi-user or production scenarios, a proper backend database and API layer would be necessary.</p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

