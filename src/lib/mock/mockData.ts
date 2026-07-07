import type { Database } from '@lib/types/database.types';
import type { Session } from '@supabase/supabase-js';

type TradesRow = Database['public']['Tables']['trades']['Row'];
type TradesSpotRow = Database['public']['Tables']['trades_spot']['Row'];
type MonthlyPlanRow = Database['public']['Tables']['monthly_plan']['Row'];

export const MOCK_USER_ID = '11111111-1111-4111-8111-111111111111';

export const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: MOCK_USER_ID,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: { display_name: 'Demo Trader' },
    email: 'demo@traderstale.local',
    created_at: new Date().toISOString(),
  },
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function previousMonthOn(day: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  d.setDate(day);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export const mockTrades: TradesRow[] = [
  {
    id: 1,
    account: 1,
    amount: 2,
    created_at: daysAgo(1),
    entry: 5720.25,
    executed: true,
    exit: 5748.5,
    fees: 4.5,
    journal: 'Clean breakout above VWAP, held through the pullback.',
    long_short: 'long',
    playbook: true,
    pnl: 565,
    risk: 100,
    stop: 5695,
    symbol: 'ES',
    target: 5760,
    time_frame: '15m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 2,
    account: 1,
    amount: 1,
    created_at: daysAgo(2),
    entry: 20450,
    executed: true,
    exit: 20395,
    fees: 2.25,
    journal: null,
    long_short: 'short',
    playbook: false,
    pnl: 275,
    risk: 70,
    stop: 20520,
    symbol: 'NQ',
    target: 20360,
    time_frame: '5m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 3,
    account: 1,
    amount: 3,
    created_at: daysAgo(0),
    entry: 78.42,
    executed: true,
    exit: null,
    fees: null,
    journal: 'Still open, watching the inventory report.',
    long_short: 'long',
    playbook: false,
    pnl: null,
    risk: 246,
    stop: 77.6,
    symbol: 'CL',
    target: 80.1,
    time_frame: '1h',
    user_id: MOCK_USER_ID,
  },
  {
    id: 4,
    account: 2,
    amount: 1,
    created_at: daysAgo(4),
    entry: 2385.4,
    executed: true,
    exit: 2402.1,
    fees: 3.1,
    journal: 'Faded resistance too early.',
    long_short: 'short',
    playbook: true,
    pnl: -167,
    risk: 245,
    stop: 2410,
    symbol: 'GC',
    target: 2350,
    time_frame: '30m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 5,
    account: 1,
    amount: 1,
    created_at: daysAgo(0),
    entry: 5702,
    executed: false,
    exit: null,
    fees: null,
    journal: 'Planned setup, not triggered yet.',
    long_short: 'long',
    playbook: false,
    pnl: null,
    risk: 22,
    stop: 5680,
    symbol: 'ES',
    target: 5740,
    time_frame: '15m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 6,
    account: 1,
    amount: 2,
    created_at: previousMonthOn(20),
    entry: 20180,
    executed: true,
    exit: 20260,
    fees: 4.5,
    journal: 'Textbook reversal off VWAP.',
    long_short: 'long',
    playbook: true,
    pnl: 800,
    risk: 120,
    stop: 20120,
    symbol: 'NQ',
    target: 20280,
    time_frame: '5m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 7,
    account: 2,
    amount: 2,
    created_at: previousMonthOn(15),
    entry: 79.8,
    executed: true,
    exit: 80.35,
    fees: 2.4,
    journal: null,
    long_short: 'short',
    playbook: false,
    pnl: -110,
    risk: 140,
    stop: 80.5,
    symbol: 'CL',
    target: 78.2,
    time_frame: '1h',
    user_id: MOCK_USER_ID,
  },
  {
    id: 8,
    account: 2,
    amount: 1,
    created_at: previousMonthOn(10),
    entry: 2360,
    executed: true,
    exit: 2388,
    fees: 1.9,
    journal: 'Followed the plan.',
    long_short: 'long',
    playbook: false,
    pnl: 280,
    risk: 200,
    stop: 2340,
    symbol: 'GC',
    target: 2400,
    time_frame: '30m',
    user_id: MOCK_USER_ID,
  },
  {
    id: 9,
    account: 1,
    amount: 1,
    created_at: previousMonthOn(5),
    entry: 5610,
    executed: true,
    exit: 5578,
    fees: 2.25,
    journal: null,
    long_short: 'short',
    playbook: false,
    pnl: 320,
    risk: 250,
    stop: 5635,
    symbol: 'ES',
    target: 5560,
    time_frame: '15m',
    user_id: MOCK_USER_ID,
  },
];

export const mockTradesSpot: TradesSpotRow[] = [
  {
    id: 1,
    amount: 0.25,
    created_at: daysAgo(3),
    description: 'Swing long on breakout above range.',
    entry: 58200,
    executed: true,
    exit: 61400,
    pnl: 800,
    symbol: 'BTC',
    url: null,
    user_id: MOCK_USER_ID,
  },
  {
    id: 2,
    amount: 2,
    created_at: daysAgo(1),
    description: 'Still holding, targeting 3400.',
    entry: 3120,
    executed: true,
    exit: null,
    pnl: null,
    symbol: 'ETH',
    url: null,
    user_id: MOCK_USER_ID,
  },
  {
    id: 3,
    amount: 15,
    created_at: daysAgo(6),
    description: 'Cut early on broken support.',
    entry: 142.5,
    executed: true,
    exit: 129.8,
    pnl: -190,
    symbol: 'SOL',
    url: null,
    user_id: MOCK_USER_ID,
  },
  {
    id: 4,
    amount: 0.1,
    created_at: previousMonthOn(18),
    description: null,
    entry: 60500,
    executed: true,
    exit: 63100,
    pnl: 260,
    symbol: 'BTC',
    url: null,
    user_id: MOCK_USER_ID,
  },
  {
    id: 5,
    amount: 1.5,
    created_at: previousMonthOn(8),
    description: 'Faded resistance too soon.',
    entry: 3050,
    executed: true,
    exit: 2980,
    pnl: -105,
    symbol: 'ETH',
    url: null,
    user_id: MOCK_USER_ID,
  },
];

export const mockMonthlyPlans: MonthlyPlanRow[] = [
  {
    id: 'mock-plan-current-month',
    content:
      '# Monthly Plan\n\n- Focus on ES and NQ during the first hour of the session.\n- Max 2 losing trades per day before stopping.\n- Review playbook setups every Friday.',
    created_at: daysAgo(6),
    month_year: currentMonthKey(),
    updated_at: daysAgo(1),
    user_id: MOCK_USER_ID,
  },
];

let tradeIdCounter = 1000;
export function nextMockTradeId(): number {
  return tradeIdCounter++;
}

let spotIdCounter = 1000;
export function nextMockSpotId(): number {
  return spotIdCounter++;
}

export function mockFindIndexById<T extends { id: number | string }>(
  rows: T[],
  id: T['id'],
): number {
  return rows.findIndex((row) => row.id === id);
}

export function mockUpdateRow<T extends { id: number | string }>(
  rows: T[],
  id: T['id'],
  patch: Partial<T>,
): T {
  const index = mockFindIndexById(rows, id);
  if (index === -1) throw new Error(`Mock row with id ${id} not found`);
  rows[index] = { ...rows[index], ...patch };
  return rows[index];
}

export function mockDeleteRow<T extends { id: number | string }>(
  rows: T[],
  id: T['id'],
): void {
  const index = mockFindIndexById(rows, id);
  if (index !== -1) rows.splice(index, 1);
}
