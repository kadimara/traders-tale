import { createClient } from '@supabase/supabase-js';
import type { Database } from '@lib/types/database.types';

const supabaseUrl = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_DEV_URL
  : import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.DEV
  ? import.meta.env.VITE_SUPABASE_DEV_KEY
  : import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
