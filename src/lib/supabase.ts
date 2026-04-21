import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mlhacgvczvreczjmcyzn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGFjZ3ZjenZyZWN6am1jeXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTk4NjcsImV4cCI6MjA5MjMzNTg2N30.IU9kyvE4f5GFQnyCPPId4sKiv4PfqIryXxYp0Jhrrl0';

const hasConfig = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10;

// If no config, create a mock client that never hangs
export const supabase = hasConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://mock.supabase.co', 'mock-key');

export const isSupabaseConfigured = () => hasConfig;
