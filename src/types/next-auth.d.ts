
import type { DefaultSession, User as NextAuthUser } from "next-auth";
import type { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Add the id property
      role?: "admin" | "agent" | string; // Add role
    } & DefaultSession["user"]; // Keep existing properties like name, email, image
  }

  interface User extends NextAuthUser {
    // You can add custom properties to the User object here if needed
    // For example, if your `authorize` callback returns a role directly on the user object.
    role?: "admin" | "agent" | string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends NextAuthJWT {
    /** OpenID ID Token */
    idToken?: string;
    id: string; // Add id to the JWT token
    role?: "admin" | "agent" | string; // Add role to JWT
  }
}
