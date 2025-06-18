import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!); // Using ! to assert non-null

const prisma = new PrismaClient();

export const signUp = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  // Optionally, create a user entry in your database with a default role
  if (user) {
    await prisma.user.create({
      data: {
        id: user.id, // Assuming Supabase user ID can be used as Prisma ID
        email: user.email!,
        role: 'agent', // Default role
      },
    });
  }
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { user, error } = await supabase.auth.signIn({ email, password });
  if (error) {
    throw error;
  }
  return user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};

export const getUserRole = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role || null;
};
