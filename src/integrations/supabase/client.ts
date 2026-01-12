import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vhkwgztbyiexxbvffmzz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoa3dnenRieWlleHhidmZmbXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODYxMjIsImV4cCI6MjA4MDQ2MjEyMn0.8l2CUf7JujTZCBrRAMXwjaZEBgGmw5MIHtiLq6_Z_cg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});