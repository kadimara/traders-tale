import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';

export type TradesSpotRow = Database['public']['Tables']['trades_spot']['Row'];
export type TradesSpotInsert =
  Database['public']['Tables']['trades_spot']['Insert'];
export type TradesSpotUpdate =
  Database['public']['Tables']['trades_spot']['Update'];

export async function tradesSpotSelectAll() {
  const { data, error } = await supabase
    .from('trades_spot')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function tradesSpotInsert(trade: TradesSpotInsert) {
  const { data, error } = await supabase
    .from('trades_spot')
    .insert([trade])
    .select()
    .single();

  if (error) throw error;
  console.log(data);
  return data;
}

export async function tradesSpotUpdate(id: number, trade: TradesSpotUpdate) {
  const { data, error } = await supabase
    .from('trades_spot')
    .update(trade)
    .eq('id', id) // pick row by ID
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function tradesSpotDelete(id: number) {
  const { error } = await supabase.from('trades_spot').delete().eq('id', id);
  if (error) throw error;
}
