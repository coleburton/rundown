import React, { createContext, useContext } from 'react';
import { Database } from '@/types/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithStrava: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser?: () => Promise<void>;
  updateUser?: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  auth?: AuthContextType;
}

export function AuthProvider({ children, auth }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
} 