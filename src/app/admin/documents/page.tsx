
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, FileLock2, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <FileLock2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Secure Documents Area</CardTitle>
            <CardDescription>
              Access granted. You can view confidential documents below.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center p-6">
            <p className="text-lg text-muted-foreground">
              Welcome to the Secure Documents section!
            </p>
            <p className="mt-2 text-sm">
              Content and document management features will be implemented here.
            </p>
            <Button onClick={() => {setIsAuthenticated(false); setError(null);}} variant="outline" className="mt-6">
                Lock Section
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

