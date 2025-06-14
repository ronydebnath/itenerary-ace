
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, UserCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Welcome, {session.user?.name || session.user?.email}! 
          {(session.user as any)?.role && <span className="font-semibold ml-1">({(session.user as any).role})</span>}
        </span>
        <Button onClick={() => signOut({ callbackUrl: '/' })} variant="outline" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn()} variant="default" size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      Sign In
    </Button>
  );
}

export function AdminAccessButton() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role === 'admin') {
    return (
      <Link href="/admin" passHref>
        <Button variant="outline" size="sm">
          <UserCircle className="mr-2 h-4 w-4" />
          Admin Dashboard
        </Button>
      </Link>
    );
  }
  return null;
}

export function AgentAccessButton() {
  const { data: session } = useSession();

  if ((session?.user as any)?.role === 'agent') {
    return (
      <Link href="/agent" passHref>
        <Button variant="outline" size="sm">
          <UserCircle className="mr-2 h-4 w-4" />
          Agent Portal
        </Button>
      </Link>
    );
  }
   return null;
}
