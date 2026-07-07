import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/database.types';
import { isMockMode } from '@lib/mock/mockMode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase: SupabaseClient<Database> = isMockMode
  ? (null as unknown as SupabaseClient<Database>)
  : createClient<Database>(supabaseUrl, supabaseKey);
