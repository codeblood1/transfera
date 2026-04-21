import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://duyhvlkvjrolpsnoopxt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eWh2bGt2anJvbHBzbm9vcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjQ5MDAsImV4cCI6MjA5MjM0MDkwMH0.V2JFp8jqpUrhC3RRMj1FW1z4Fpuq8jWor66nKb8FrRA';

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
