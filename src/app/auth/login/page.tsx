
"use client";

import * as React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, LogIn, MailQuestion } from "lucide-react";
import { sendPasswordResetEmail } from '@/lib/email-service'; // Import the placeholder
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const { status } = useSession();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(error);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const result = await signIn('credentials', {
        redirect: false, 
        email: values.email,
        password: values.password,
        callbackUrl: callbackUrl
      });

      if (result?.error) {
        setLoginError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
      } else if (result?.ok) {
        router.replace(callbackUrl); 
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = form.getValues("email") || window.prompt("Please enter your email address to reset your password:");
    if (email && z.string().email().safeParse(email).success) {
      setIsLoading(true);
      // In a real app, you'd call a backend API here.
      // This API would generate a secure token, save it, and then use SendGrid.
      const dummyResetLink = `${window.location.origin}/auth/reset-password?token=DUMMY_RESET_TOKEN_FOR_${email.replace(/[^a-zA-Z0-9]/g, "")}`;
      const result = await sendPasswordResetEmail(email, dummyResetLink);
      if (result.success) {
        toast({
          title: "Password Reset Email Sent (Simulated)",
          description: `If an account exists for ${email}, a password reset link has been sent (check console). ${result.message}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Password Reset Failed (Simulated)",
          description: `Could not send password reset email. ${result.message}`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    } else if (email) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
    }
  };
  
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your Itinerary Ace dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {loginError && (
                <Alert variant="destructive">
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Password</FormLabel>
                       <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="text-xs h-auto p-0 text-primary hover:underline"
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="flex flex-col items-center text-xs text-muted-foreground pt-6">
            <p className="mb-1">Demo Admin: admin@example.com / password</p>
            <p>Demo Agent: agent@example.com / password</p>
            <p className="mt-3 text-destructive font-semibold">Note: Account creation is not implemented.</p>
          </CardFooter>
      </Card>
    </main>
  );
}

