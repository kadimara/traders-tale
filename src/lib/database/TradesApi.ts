import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';

export type TradesRow = Database['public']['Tables']['trades']['Row'];
export type TradesInsert = Database['public']['Tables']['trades']['Insert'];
export type TradesUpdate = Database['public']['Tables']['trades']['Update'];

export async function tradesSelectAll() {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function tradesInsert(trade: TradesInsert) {
  const { data, error } = await supabase
    .from('trades')
    .insert([trade])
    .select()
    .single();

  if (error) throw error;
  console.log(data);
  return data;
}

export async function tradesUpdate(id: number, trade: TradesUpdate) {
  const { data, error } = await supabase
    .from('trades')
    .update(trade)
    .eq('id', id) // pick row by ID
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function tradesDelete(id: number) {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}
