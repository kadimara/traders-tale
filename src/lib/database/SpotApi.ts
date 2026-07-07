import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';
import { isMockMode } from '@lib/mock/mockMode';
import {
  mockTradesSpot,
  nextMockSpotId,
  mockUpdateRow,
  mockDeleteRow,
  MOCK_USER_ID,
} from '@lib/mock/mockData';

export type TradesSpotRow = Database['public']['Tables']['trades_spot']['Row'];
export type TradesSpotInsert =
  Database['public']['Tables']['trades_spot']['Insert'];
export type TradesSpotUpdate =
  Database['public']['Tables']['trades_spot']['Update'];

export async function tradesSpotSelectAll() {
  if (isMockMode) {
    return [...mockTradesSpot].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }

  const { data, error } = await supabase
    .from('trades_spot')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function tradesSpotInsert(trade: TradesSpotInsert) {
  if (isMockMode) {
    const newTrade: TradesSpotRow = {
      amount: trade.amount,
      created_at: trade.created_at ?? new Date().toISOString(),
      description: trade.description ?? null,
      entry: trade.entry,
      executed: trade.executed ?? false,
      exit: trade.exit ?? null,
      id: nextMockSpotId(),
      pnl: trade.pnl ?? null,
      symbol: trade.symbol,
      url: trade.url ?? null,
      user_id: trade.user_id ?? MOCK_USER_ID,
    };
    mockTradesSpot.unshift(newTrade);
    return newTrade;
  }

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
  if (isMockMode) return mockUpdateRow(mockTradesSpot, id, trade);

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
  if (isMockMode) return mockDeleteRow(mockTradesSpot, id);

  const { error } = await supabase.from('trades_spot').delete().eq('id', id);
  if (error) throw error;
}
