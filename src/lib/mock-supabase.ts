import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Create a mock Supabase client that doesn't require actual credentials
export const supabase = createClient<Database>(
  'http://mock-supabase-url.com',
  'mock-anon-key',
  {
    auth: {
      persistSession: false,
      // Add any other required auth options
    },
  }
); 