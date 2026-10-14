import { useState } from 'react';
import { okxSync, type OkxSyncResult } from '@lib/database/OkxApi';
import { useTradesContext } from '@lib/context/TradesContext';

// Imports closed OKX positions into trades: previews the changes, asks for
// confirmation, applies them and reloads the trades. Used by the dashboard OKX
// panel and the trades table header.
export function useOkxSync() {
  const { reloadTrades } = useTradesContext();
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const preview = await okxSync(false);
      if (!preview.updates.length && !preview.creates.length) {
        alert(`Everything is synced (${preview.closedPositions} closed positions on OKX).`);
      } else if (confirm(syncSummary(preview))) {
        const result = await okxSync(true);
        await reloadTrades();
        alert(`Synced: ${result.updates.length} updated, ${result.creates.length} added.`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
    setSyncing(false);
  };

  return { sync, syncing };
}

function syncSummary({ updates, creates, alreadySynced }: OkxSyncResult) {
  const day = (iso: string) => iso.slice(0, 10);
  const lines = [
    `Sync closed OKX positions into your trades?`,
    `${updates.length} trade(s) updated, ${creates.length} added, ${alreadySynced} already synced.`,
    '',
    ...updates.map(
      (u) =>
        `UPDATE ${day(u.date)} ${u.symbol} ${u.long_short} @ ${u.changes.entry}: ` +
        `exit ${u.exitBefore ?? '—'} → ${u.changes.exit}, PnL ${u.pnlBefore ?? '—'} → ${u.changes.pnl}` +
        (u.statusBefore !== 'taken' ? ` (${u.statusBefore} → taken)` : ''),
    ),
    ...creates.map(
      (c) =>
        `ADD ${day(c.date)} ${c.symbol} ${c.long_short} @ ${c.changes.entry}: ` +
        `exit ${c.changes.exit}, PnL ${c.changes.pnl}`,
    ),
  ];
  return lines.join('\n');
}
