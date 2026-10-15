import { pb } from './PocketBaseClient';

// Client for the read-only OKX routes in pocketbase/pb_hooks/okx.pb.js. Each
// user's OKX keys live in the okx_connections collection on the server.

type SyncChanges = { entry: number; exit: number; amount: number; fees: number; pnl: number };

export type OkxSyncResult = {
  applied: boolean;
  closedPositions: number;
  alreadySynced: number;
  updates: {
    tradeId: string;
    date: string;
    symbol: string;
    long_short: string;
    statusBefore: string;
    exitBefore: number | null;
    pnlBefore: number | null;
    changes: SyncChanges;
  }[];
  creates: { date: string; symbol: string; long_short: string; instId: string; changes: SyncChanges }[];
};

/** Current OKX account equity in USD (including unrealized PnL). */
export function okxBalance() {
  return pb.send<{ totalEq: number }>('/api/okx/balance', { method: 'GET' });
}

/** Without `apply` this only reports what a sync would change. */
export function okxSync(apply: boolean) {
  return pb.send<OkxSyncResult>('/api/okx/sync', { method: 'POST', body: { apply } });
}
