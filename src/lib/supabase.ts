import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize with dummy values if missing to prevent immediate crash during boot
// Note: Auth operations will still fail until valid keys are provided in the Secrets panel.
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, options)
  : createClient('https://placeholder-url.supabase.co', 'placeholder-key', options);

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  balance: number;
  total_earned: number;
  level: string;
  created_at: string;
};
