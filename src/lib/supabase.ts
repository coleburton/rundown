import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use mock values for development if environment variables are not set
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key';

console.log('Supabase client configuration:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasRealUrl: supabaseUrl.includes('supabase.co'),
  hasRealKey: supabaseAnonKey.length > 100,
  usingMock: supabaseUrl === 'http://localhost:54321'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
}); 