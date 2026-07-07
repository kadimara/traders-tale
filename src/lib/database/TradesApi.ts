import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';
import { isMockMode } from '@lib/mock/mockMode';
import {
  mockTrades,
  nextMockTradeId,
  mockUpdateRow,
  mockDeleteRow,
  MOCK_USER_ID,
} from '@lib/mock/mockData';

export type TradesRow = Database['public']['Tables']['trades']['Row'];
export type TradesInsert = Database['public']['Tables']['trades']['Insert'];
export type TradesUpdate = Database['public']['Tables']['trades']['Update'];

export async function tradesSelectAll() {
  if (isMockMode) {
    return [...mockTrades].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function tradesSelectByMonth(monthKey: string) {
  const startDate = new Date(monthKey);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  if (isMockMode) {
    return mockTrades
      .filter((trade) => {
        const createdAt = new Date(trade.created_at);
        return createdAt >= startDate && createdAt < endDate;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function tradesInsert(trade: TradesInsert) {
  if (isMockMode) {
    const newTrade: TradesRow = {
      account: trade.account,
      amount: trade.amount,
      created_at: trade.created_at ?? new Date().toISOString(),
      entry: trade.entry,
      executed: trade.executed ?? false,
      exit: trade.exit ?? null,
      fees: trade.fees ?? null,
      id: nextMockTradeId(),
      journal: trade.journal ?? null,
      long_short: trade.long_short,
      playbook: trade.playbook ?? false,
      pnl: trade.pnl ?? null,
      risk: trade.risk ?? null,
      stop: trade.stop,
      symbol: trade.symbol,
      target: trade.target,
      time_frame: trade.time_frame,
      user_id: trade.user_id ?? MOCK_USER_ID,
    };
    mockTrades.unshift(newTrade);
    return newTrade;
  }

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
  if (isMockMode) return mockUpdateRow(mockTrades, id, trade);

  const { data, error } = await supabase
    .from('trades')
    .update(trade)
    .eq('id', id) // pick row by ID
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function tradesSelectById(id: number) {
  if (isMockMode) {
    const trade = mockTrades.find((t) => t.id === id);
    if (!trade) throw new Error(`Mock trade with id ${id} not found`);
    return trade;
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function tradesDelete(id: number) {
  if (isMockMode) return mockDeleteRow(mockTrades, id);

  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
}

export async function tradesSelectPlaybook() {
  if (isMockMode) {
    return mockTrades
      .filter((trade) => trade.playbook)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('playbook', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
