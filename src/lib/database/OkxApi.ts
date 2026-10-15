import { pb } from './PocketBaseClient';

// Client for the OKX routes in pocketbase/pb_hooks/okx.pb.js. Each user's OKX
// keys live in the okx_connections collection on the server. Only okxOrder
// writes to OKX.

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

export type OkxOrderResult = {
  placed: boolean;
  ordId?: string;
  tradeId: string;
  symbol: string;
  long_short: string;
  order: {
    instId: string;
    tdMode: string;
    side: 'buy' | 'sell';
    posSide?: 'long' | 'short';
    ordType: 'limit';
    px: string;
    sz: string;
    attachAlgoOrds: { slTriggerPx: string }[];
  };
  contracts: number;
  sizeUsd: number;
  riskUsd: number;
  lastPx: number;
  previousOrderState: string | null;
};

/** Without `confirmed` (the previewed order) this only returns the order it would place. */
export function okxOrder(tradeId: string, confirmed?: OkxOrderResult['order']) {
  return pb.send<OkxOrderResult>('/api/okx/order', {
    method: 'POST',
    body: confirmed ? { tradeId, apply: true, px: confirmed.px, sz: confirmed.sz } : { tradeId },
  });
}
