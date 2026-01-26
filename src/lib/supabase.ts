import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn but don't crash immediately to allow app to load for config
  console.warn('Missing Supabase environment variables! Check authentication setup.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
