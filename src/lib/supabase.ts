import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Fallback values from Lovable Cloud configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ajhvxkbmpbuslllbgkab.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqaHZ4a2JtcGJ1c2xsbGJna2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDMwNTMsImV4cCI6MjA3NzQxOTA1M30.z0pFauKITaI1nRRTPBf6J124XOHWnVJWSG9_KChe2w8';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
