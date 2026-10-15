import type { RecordModel } from 'pocketbase';
import { currentUserId, pb } from './PocketBaseClient';

export const TRADE_STATUSES = ['planned', 'taken', 'missed'] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export type TradesRow = {
  id: string;
  user: string;
  created_at: string;
  symbol: string;
  long_short: string;
  account: number;
  amount: number;
  entry: number;
  stop: number;
  exit: number | null;
  fees: number | null;
  risk: number | null;
  pnl: number | null;
  journal: string | null;
  playbook: boolean;
  status: TradeStatus;
  /** "<instId>:<ordId>" of the OKX order placed for this trade; set by the server only. */
  okx_order: string | null;
};

export type TradesInsert = Omit<
  TradesRow,
  'id' | 'user' | 'created_at' | 'status' | 'playbook' | 'exit' | 'fees' | 'risk' | 'pnl' | 'journal' | 'okx_order'
> &
  Partial<Pick<TradesRow, 'created_at' | 'status' | 'playbook' | 'exit' | 'fees' | 'risk' | 'pnl' | 'journal'>>;
export type TradesUpdate = Partial<Omit<TradesRow, 'id' | 'user' | 'okx_order'>>;

const trades = () => pb.collection('trades');

// PocketBase stores empty number fields as 0 and empty text as "";
// map those back to null so the UI keeps showing "—" for missing values.
const nullIfZero = (n: number) => (n === 0 ? null : n);

function toRow(record: RecordModel): TradesRow {
  return {
    id: record.id,
    user: record.user,
    // PocketBase returns "YYYY-MM-DD HH:mm:ss.sssZ"; use ISO so every browser parses it.
    created_at: String(record.created_at).replace(' ', 'T'),
    symbol: record.symbol,
    long_short: record.long_short,
    account: record.account,
    amount: record.amount,
    entry: record.entry,
    stop: record.stop,
    exit: nullIfZero(record.exit),
    fees: nullIfZero(record.fees),
    risk: nullIfZero(record.risk),
    pnl: nullIfZero(record.pnl),
    journal: record.journal || null,
    playbook: record.playbook,
    status: record.status,
    okx_order: record.okx_order || null,
  };
}

export async function tradesSelectAll() {
  const records = await trades().getFullList({ sort: '-created_at' });
  return records.map(toRow);
}

export async function tradesSelectByMonth(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const records = await trades().getFullList({
    filter: pb.filter('created_at >= {:start} && created_at < {:end}', {
      start: startDate,
      end: endDate,
    }),
    sort: '-created_at',
  });
  return records.map(toRow);
}

export async function tradesInsert(trade: TradesInsert) {
  const record = await trades().create({
    created_at: new Date().toISOString(),
    status: 'planned',
    ...trade,
    user: currentUserId(),
  });
  return toRow(record);
}

export async function tradesUpdate(id: string, trade: TradesUpdate) {
  const record = await trades().update(id, trade);
  return toRow(record);
}

export async function tradesSelectById(id: string) {
  const record = await trades().getOne(id);
  return toRow(record);
}

export async function tradesDelete(id: string) {
  await trades().delete(id);
}

export async function tradesSelectPlaybook() {
  const records = await trades().getFullList({
    filter: 'playbook = true',
    sort: '-created_at',
  });
  return records.map(toRow);
}
