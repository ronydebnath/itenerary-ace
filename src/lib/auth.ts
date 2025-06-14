
import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // IMPORTANT: Add your own logic here to look up the user from
        // the credentials supplied. You'll need to connect to your database
        // and verify the password.
        //
        // Example (very basic, NOT for production):
        if (credentials?.email === "admin@example.com" && credentials?.password === "password") {
          // Any object returned will be saved in `user` property of the JWT
          const user: User = { id: "admin-user-id", email: "admin@example.com", name: "Admin User" };
          return user;
        }
        if (credentials?.email === "agent@example.com" && credentials?.password === "password") {
          const user: User = { id: "agent-user-id", email: "agent@example.com", name: "Agent User" };
          return user;
        }

        // If you return null or false then the credentials will be rejected
        console.error("Invalid credentials:", credentials?.email);
        return null;
        // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    // error: '/auth/error', // Optional: custom error page
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user's role or other properties to the token
      if (user) {
        // Example: Assign role based on email for demo purposes
        // In a real app, this would come from your user database
        if (user.email === "admin@example.com") {
          (token as any).role = "admin";
        } else if (user.email === "agent@example.com") {
          (token as any).role = "agent";
        }
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = (token as any).role; // Add role to session
      }
      return session;
    }
  },
  // Ensure you have NEXTAUTH_SECRET set in your .env file
  secret: process.env.NEXTAUTH_SECRET,
};
