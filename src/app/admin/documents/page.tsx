
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, FileLock2, AlertCircle, Eye, EyeOff, BookOpen, Puzzle, Users, Brain, Database, CheckSquare, Briefcase, Settings, Lightbulb, Smartphone, MailWarning, KeyRound } from 'lucide-react';
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
                   <div className="flex items-center"><CheckSquare className="mr-2 h-5 w-5"/>Core Functionality</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2 pl-2">
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">1. Itinerary Planning & Management</h4>
                    <p className="text-xs mt-1">
                      The core of Itinerary Ace is its powerful itinerary planning suite. This module allows for the detailed creation and management of multi-day travel plans.
                    </p>

                    <h5 className="font-medium text-foreground/80 mt-2 text-xs">Key Features:</h5>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Create itineraries spanning multiple days.</li>
                      <li>Plan activities, accommodations, transfers, meals, and miscellaneous items for each day.</li>
                      <li>Define and manage traveler details (adults, children) for the trip.</li>
                      <li>Assign or exclude specific travelers from individual itinerary items.</li>
                      <li>Utilize a library of predefined service prices or input custom pricing for itinerary items.</li>
                      <li>Calculate estimated costs for the entire itinerary dynamically.</li>
                      <li>Save itineraries to local storage, load existing ones, or mark them as templates for reuse.</li>
                      <li>Link itineraries to agent quotation requests.</li>
                      <li>View detailed cost breakdowns per traveler and per service category.</li>
                      <li>Generate print-friendly views of the itinerary with optional cost display.</li>
                       <li>Tag itineraries for better organization and filtering.</li>
                    </ul>

                    <h5 className="font-medium text-foreground/80 mt-2 text-xs">Core Logic & Structure:</h5>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li><strong>Day-by-Day Planning:</strong> Itineraries are structured by day numbers, determined by the 'Start Date' and 'Number of Days' settings in the Planner Header. Each day can contain multiple service items.</li>
                      <li><strong>Item Types:</strong> Various services can be added:
                        <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                          <li><strong>Hotel:</strong> Manage hotel stays, including check-in/checkout days (checkout day must be after check-in day). Supports selection from predefined hotel definitions or custom entry. Allows configuration of multiple room bookings for a single hotel stay, specifying room type, number of rooms, assigned travelers, and optional extra beds. Hotel rates are often seasonal and are sourced from the hotel's master definition.</li>
                          <li><strong>Activity:</strong> Plan tours, excursions, or entrance tickets. Can be single-day or span multiple days (using 'End Day' field). Supports selection from predefined activity services, which may include multiple packages with different pricing, or custom pricing.</li>
                          <li><strong>Transfer:</strong> Arrange transportation (e.g., airport transfers, inter-city travel). Supports 'ticket' (per person) or 'vehicle' (per service) pricing modes. Vehicle mode can use predefined vehicle options from a master service or allow custom entry of vehicle type and cost per vehicle. Surcharge periods can apply to vehicle transfers.</li>
                          <li><strong>Meal:</strong> Plan specific meals (breakfast, lunch, dinner). Priced per adult/child per meal, with a specified number of meals. Can use predefined meal services or custom pricing.</li>
                          <li><strong>Miscellaneous:</strong> Add other costs like visa fees, guide fees, or souvenirs. Can be priced per person or as a total shared cost for a given quantity.</li>
                        </ul>
                      </li>
                      <li><strong>Traveler Assignment:</strong> Each itinerary item allows for excluding specific travelers. This ensures costs are calculated only for participating individuals for that particular service.</li>
                      <li><strong>Predefined vs. Custom Pricing:</strong> For each item type, users can select from a list of predefined services (master price list). This pre-fills pricing and details. Alternatively, users can input custom names, notes, and prices directly if a predefined service is not selected or suitable.</li>
                      <li><strong>Currency Handling:</strong> Each itinerary has a primary "Billing Currency" set in the Planner Header. Individual predefined services are stored with their own "Source Currency". When a predefined service is used, its cost is converted from its source currency to the itinerary's billing currency using exchange rates (and any defined markups) managed in the "Currency Management" section. Custom-priced items are assumed to be in the itinerary's billing currency.</li>
                    </ul>

                    <h5 className="font-medium text-foreground/80 mt-2 text-xs">Data Filtering for Service Selection:</h5>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>When adding items in the planner, dropdowns for predefined services (e.g., hotels, activities) are dynamically filtered to show relevant options.</li>
                      <li><strong>Filtering criteria include:</strong>
                          <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                              <li><strong>Item's Location Context:</strong> This is determined by:
                                  <ol className="list-decimal pl-4 text-xs">
                                      <li>The specific "Country for this item" and "Province for this item" selected within the item's form.</li>
                                      <li>If not set at the item level, it falls back to the "Selected Countries" and "Selected Provinces" globally defined for the itinerary in the Planner Header.</li>
                                      <li>If neither item-specific nor global locations are set, services without specific location tags (or matching any generic criteria) might be shown.</li>
                                  </ol>
                              </li>
                              <li><strong>Item's Source Currency:</strong> The dropdowns attempt to show services priced in a currency relevant to the item's context (e.g., default currency of the item's selected country, or the itinerary's billing currency if no specific country context is set for the item). This is managed within each item form.</li>
                              <li><strong>Service Category:</strong> Only services matching the item type being added (e.g., only 'hotel' services for a hotel item) are shown.</li>
                          </ul>
                      </li>
                      <li>This filtering helps users quickly find relevant predefined services.</li>
                    </ul>
                    
                    <h5 className="font-medium text-foreground/80 mt-2 text-xs">Cost Calculation Overview (Conceptual - see `src/lib/calculation-utils.ts`):</h5>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li><strong>Individual Item Costs (Source Currency):</strong>
                        <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                          <li><strong>Transfers (Ticket):</strong> (Adult Price x #Adults) + (Child Price x #Children).</li>
                          <li><strong>Transfers (Vehicle):</strong> (Base Cost/Vehicle + Applicable Surcharge) x #Vehicles. This total is then distributed among participating travelers.</li>
                          <li><strong>Activities:</strong> (Adult Price x #Adults) + (Child Price x #Children). If a package is selected, package prices apply. Duration doesn't change per-person price for fixed-price activities/packages.</li>
                          <li><strong>Hotels:</strong> For each selected room booking: Sum of (Nightly Rate + Extra Bed Rate if applicable) for each night of the stay (derived from seasonal prices of the room type definition), multiplied by the number of identical rooms in that booking. Total cost for the hotel stay is the sum of all room bookings. Distributed among assigned travelers or overall participants.</li>
                          <li><strong>Meals:</strong> (Adult Price x #Adults x #Meals) + (Child Price x #Children x #Meals).</li>
                          <li><strong>Miscellaneous:</strong> If 'perPerson': Unit Cost x Quantity x (#Adults + #Children). If 'total': Unit Cost x Quantity, then distributed among participants.</li>
                        </ul>
                      </li>
                      <li><strong>Currency Conversion:</strong> After an item's cost is calculated in its source currency (from predefined service or item's country context), if this source currency differs from the itinerary's main "Billing Currency", the system applies the relevant exchange rate (including any global or specific-pair markups configured in Currency Management) to convert the cost into the billing currency.</li>
                      <li><strong>Summaries Displayed in Planner:</strong>
                        <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                          <li><strong>Per-Traveler Cost Breakdown:</strong> Shows the total apportioned cost for each traveler in the itinerary's billing currency.</li>
                          <li><strong>Grand Total:</strong> The sum of all item costs, in the itinerary's billing currency.</li>
                          <li><strong>Detailed Itinerary Summary Table:</strong> Groups all items by category (Hotels, Activities, etc.) and shows sub-totals per category and individual item costs, all in the billing currency.</li>
                        </ul>
                      </li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">2. Service Pricing Management</h4>
                    <p className="text-xs mt-1">
                      This module is the central hub for defining and maintaining the master list of prices for all services offered, such as hotels, activities, transfers, meals, and miscellaneous items.
                    </p>
                    <h5 className="font-medium text-foreground/80 mt-2 text-xs">Key Features:</h5>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>
                        <strong>Centralized Price List:</strong> Maintain a single source of truth for all service costs, ensuring consistency across all itineraries.
                      </li>
                      <li>
                        <strong>Categorized Services:</strong> Services are organized by type (Hotel, Activity, Transfer, Meal, Misc) for easy management and filtering.
                      </li>
                      <li>
                        <strong>Flexible Pricing Structures:</strong>
                        <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                          <li><strong>Simple Pricing:</strong> Define primary (e.g., adult) and secondary (e.g., child) prices for services like meals or basic ticketed transfers.</li>
                          <li><strong>Hotel Pricing:</strong> Define detailed hotel information, including multiple room types. Each room type can have multiple seasonal pricing periods with specific nightly rates and extra bed rates. Star ratings can also be assigned.</li>
                          <li><strong>Activity Pricing:</strong> Manage activities with single pricing or multiple distinct packages. Each package can have its own adult/child prices, notes, and scheduling details (validity dates, weekday closures, specific closed dates).</li>
                          <li><strong>Transfer Pricing:</strong>
                            <ul className="list-square pl-3 mt-0.5 space-y-0.5">
                              <li><em>Ticket Basis:</em> Price per adult/child for shared transfers.</li>
                              <li><em>Vehicle Basis:</em> Define multiple vehicle options (e.g., Sedan, Van, Minibus) for a route, each with its own price per vehicle and maximum passenger capacity. Date-based surcharges can also be applied to vehicle transfers.</li>
                            </ul>
                          </li>
                          <li><strong>Miscellaneous Pricing:</strong> Define unit costs for various other items, specifying whether the cost is per person or a total shared cost.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Location-Based Pricing:</strong> Associate services with specific countries and provinces, allowing for regional price variations. If no location is set, the service is considered generic.
                      </li>
                      <li>
                        <strong>Currency Specification:</strong> Each master service price is defined in its source currency. This is used for accurate cost conversion when the service is added to an itinerary with a different billing currency.
                      </li>
                      <li>
                        <strong>"Favorites" System:</strong> Mark frequently used or preferred services as "Favorites" for quick filtering and easier access when planning itineraries.
                      </li>
                      <li>
                        <strong>AI-Assisted Data Entry:</strong>
                        <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                            <li><strong>Contract Parser:</strong> Paste text from supplier contracts (e.g., hotel agreements), and the AI will attempt to extract key details like service name, category, pricing, and location to prefill the "Add New Service Price" form, significantly speeding up data entry.</li>
                            <li><strong>Activity Parser:</strong> Paste general text describing an activity with multiple options, and the AI will attempt to parse out individual packages, their names, and prices to prefill the activity package section.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Unit Description:</strong> Specify what the price refers to (e.g., "per person", "per night", "per vehicle", "per ticket") for clarity.
                      </li>
                      <li>
                        <strong>Notes:</strong> Add general notes or important terms and conditions for each service.
                      </li>
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

              <AccordionItem value="future-development">
                <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                  <div className="flex items-center"><Lightbulb className="mr-2 h-5 w-5"/>Future Development Roadmap</div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pt-2 pl-2">
                  <p>This section outlines potential enhancements and new features for Itinerary Ace.</p>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground flex items-center"><MailWarning className="mr-2 h-4 w-4 text-destructive"/>Next Steps for Email Integration (SendGrid)</h4>
                    <p className="text-xs mt-1 mb-2">
                      The frontend placeholders for email sending are set up. To make this fully functional and secure, the following backend development is required:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Create Backend API Endpoints:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Develop API routes in your Next.js application (e.g., in `src/app/api/auth/forgot-password` and `src/app/api/auth/reset-password`).</li>
                          <li>These endpoints will receive requests from the frontend (e.g., when a user clicks "Forgot Password?").</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Secure API Key Management:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>The `SENDGRID_API_KEY` and `EMAIL_FROM` environment variables **must only be accessed on the server-side** within these API routes.</li>
                          <li>Do NOT expose your SendGrid API key in client-side JavaScript.</li>
                        </ul>
                      </li>
                       <li>
                        <strong>Password Reset Token Logic (Backend):</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>When `/api/auth/forgot-password` is called:
                            <ul className="list-circle pl-3">
                              <li>Verify the user's email exists in your user database (once implemented).</li>
                              <li>Generate a cryptographically secure, unique, and short-lived password reset token.</li>
                              <li>Store this token securely, associated with the user's ID and an expiration timestamp (e.g., in your user database).</li>
                              <li>Construct the password reset link (e.g., `https://yourapp.com/auth/reset-password?token=YOUR_SECURE_TOKEN`).</li>
                            </ul>
                          </li>
                          <li>When `/api/auth/reset-password` is called (with token and new password):
                             <ul className="list-circle pl-3">
                              <li>Verify the token: check if it exists, hasn't expired, and matches a user.</li>
                              <li>If valid, hash the new password and update it in your user database.</li>
                              <li>Invalidate the used token.</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Actual Email Sending (Backend):</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Inside your backend API routes, use the `@sendgrid/mail` SDK (already installed) with your configured API key to send the emails (e.g., password reset link email, welcome emails).</li>
                          <li>Example for sending password reset email: The `/api/auth/forgot-password` endpoint, after generating and storing the token, would call `sgMail.send(...)`.</li>
                        </ul>
                      </li>
                       <li>
                        <strong>Error Handling & User Feedback:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Implement robust error handling in your API routes.</li>
                          <li>Provide clear feedback to the frontend (e.g., "If an account with that email exists, a reset link has been sent," or "Invalid/expired reset token").</li>
                        </ul>
                      </li>
                    </ol>
                    <p className="text-xs mt-2">
                      <strong>Note:</strong> The current `src/lib/email-service.ts` is a frontend placeholder. The actual email sending logic using `sgMail.send()` must reside in your backend API routes.
                    </p>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Backend & Database Integration</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Transition from LocalStorage to a robust backend database (e.g., PostgreSQL, Firestore).</li>
                      <li>Develop APIs for all data operations (CRUD for itineraries, services, users, etc.).</li>
                      <li>Implement user authentication and authorization more deeply with role-based access control via the backend.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Enhanced Itinerary Management</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Itinerary cloning/duplication.</li>
                      <li>Version history for itineraries.</li>
                      <li>Ability to generate PDF documents directly from the itinerary view.</li>
                      <li>Option to create multiple distinct proposals for a single quotation request.</li>
                      <li>More sophisticated search and filtering for saved itineraries.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Agent & Client Portal Enhancements</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>More detailed agent dashboard with key performance indicators.</li>
                      <li>Client-facing view of approved itineraries (read-only or interactive).</li>
                      <li>Improved notification system for quote updates and communications.</li>
                      <li>Ability for agents to manage a list of their direct clients.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Advanced Pricing & Costing</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Support for supplier commissions and net rates.</li>
                      <li>More complex markup rules (e.g., per-item type, tiered markups).</li>
                      <li>Profitability analysis tools.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground">Operational Tools</h4>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                      <li>Reporting tools for sales, popular services, etc.</li>
                      <li>Bulk import/export for service prices.</li>
                      <li>User activity logging for admins.</li>
                    </ul>
                  </Card>
                  <Card className="bg-card/50 p-3">
                    <h4 className="font-medium text-foreground flex items-center"><Smartphone className="mr-2 h-4 w-4"/>Mobile Application Development</h4>
                    <p className="text-xs mt-1 mb-2">
                      Developing a companion mobile application would require the following key technical steps:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1.5 text-xs">
                      <li>
                        <strong>Backend API Development (Crucial Prerequisite):</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Design and implement a robust backend API (e.g., RESTful or GraphQL) to manage all data currently handled by `localStorage`. This includes itineraries, service prices, user profiles, quotation requests, etc.</li>
                          <li>Choose a server-side technology stack (e.g., Node.js with Express/NestJS, Python with Django/Flask, or a serverless architecture).</li>
                          <li>Integrate a scalable database (e.g., PostgreSQL, MySQL, MongoDB, Firestore) as the central data store.</li>
                          <li>Implement secure authentication and authorization mechanisms for API endpoints (e.g., JWT-based).</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Mobile Technology Stack Selection:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li><strong>Native Development:</strong> For optimal performance and platform integration.
                            <ul className="list-circle pl-3">
                              <li>iOS: Swift or Objective-C.</li>
                              <li>Android: Kotlin or Java.</li>
                            </ul>
                          </li>
                          <li><strong>Cross-Platform Development:</strong> For faster development and code sharing if targeting both platforms.
                            <ul className="list-circle pl-3">
                              <li><strong>React Native:</strong> A natural choice given the web app's React/Next.js stack, allowing for potential code/logic reuse.</li>
                              <li>Flutter: Known for its expressive UI and good performance.</li>
                              <li>Other frameworks like NativeScript, Xamarin.</li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                       <li>
                        <strong>Core Mobile App Features (Minimum Viable Product - MVP):</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Secure user authentication (login/logout) connecting to the backend API.</li>
                          <li>Ability for agents/users to view their assigned/created itineraries or proposals.</li>
                          <li>Display itinerary details, including day-by-day plans.</li>
                          <li>View status of quotation requests (for agents).</li>
                          <li>(Potentially for agents) Submit new quotation requests through a simplified mobile form.</li>
                        </ul>
                      </li>
                       <li>
                        <strong>Mobile Data Management:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Implement an API client within the mobile app to communicate with the backend.</li>
                          <li>Consider local data storage/caching strategies (e.g., SQLite, Realm, or platform-specific solutions like Core Data/Room) for offline access to key information and improved performance.</li>
                          <li>Implement data synchronization logic between the mobile app's local cache and the backend.</li>
                        </ul>
                      </li>
                       <li>
                        <strong>User Interface (UI) / User Experience (UX) Design for Mobile:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Design mobile-first interfaces that are intuitive and optimized for smaller screens and touch interactions.</li>
                          <li>Adapt existing web UI concepts where appropriate but prioritize mobile usability.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Push Notification System:</strong>
                         <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Integrate a push notification service (e.g., Firebase Cloud Messaging (FCM), Apple Push Notification service (APNs)).</li>
                          <li>Implement backend logic to trigger notifications for important events (e.g., new quotation proposal ready, status updates on requests, itinerary changes).</li>
                        </ul>
                      </li>
                      <li>
                        <strong>Testing and Deployment:</strong>
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                          <li>Thorough testing on various devices and OS versions.</li>
                          <li>Adherence to platform-specific guidelines for submission to app stores (Apple App Store, Google Play Store).</li>
                        </ul>
                      </li>
                    </ol>
                    <p className="text-xs mt-2">
                      <strong>Note:</strong> The current web application's refactoring of data hooks to encapsulate `localStorage` logic is a good first step, as it makes the web frontend more API-ready. The mobile app would primarily consume these new backend APIs.
                    </p>
                  </Card>
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


    