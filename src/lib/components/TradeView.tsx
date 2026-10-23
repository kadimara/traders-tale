import type { ReactNode } from 'react';
import { Edit, Save, Send, X, XOctagon } from 'react-feather';
import type { TradesRow } from '@lib/database/TradesApi';
import { useTradeEdit } from '@lib/hooks/useTradeEdit';
import { useOkxOrder } from '@lib/hooks/useOkxOrder';
import { TradeDocument } from './TradeDocument';
import { TradeCells, TradeColumnHeaders } from './TradesTable';

// Shown in the title of the trade page; the plan page always trades BTC.
const hiddenColumns: (keyof TradesRow)[] = ['created_at', 'symbol', 'long_short'];

/**
 * One trade as a table row and its journal, with the edit and OKX order
 * buttons, which float over the top right of `title` and stick below the
 * header.
 */
export function TradeView({
  trade,
  onSaved,
  title,
}: {
  trade: TradesRow;
  onSaved: (trade: TradesRow) => void;
  title?: ReactNode;
}) {
  const { send, cancel: cancelOrder, sending } = useOkxOrder();
  // One edit mode for the table row and the journal, saved together.
  const { draft, editing, edit, save, cancel, change } = useTradeEdit(trade, onSaved);

  return (
    // A block wrapper, so the zero-height toolbar adds no gap and sticks over the whole trade.
    <div>
      <div className="sticky-toolbar">
        {editing ? (
          <>
            <button aria-label="Save" title="Save" onClick={save}>
              <Save />
            </button>
            <button aria-label="Cancel" title="Cancel" onClick={cancel}>
              <X />
            </button>
          </>
        ) : (
          <>
            <button aria-label="Edit" title="Edit" onClick={edit}>
              <Edit />
            </button>
            {trade.status === 'planned' && (
              <button
                aria-label="Send to OKX"
                title="Send to OKX as a limit order with stop-loss"
                onClick={() => send(trade.id)}
                disabled={sending}
              >
                <Send />
              </button>
            )}
            {trade.status === 'live' && trade.okx_order && (
              <button
                aria-label="Cancel OKX order"
                title={`Cancel the OKX order (${trade.okx_order})`}
                onClick={() => cancelOrder(trade.id)}
                disabled={sending}
              >
                <XOctagon />
              </button>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-col gap-2">{title}</div>
        <table>
          <thead className="text-muted" style={{ fontSize: '0.82rem' }}>
            <tr>
              <TradeColumnHeaders hide={hiddenColumns} />
            </tr>
          </thead>
          <tbody>
            <tr>
              <TradeCells
                trade={draft}
                editing={editing}
                onChange={change}
                hide={hiddenColumns}
                center
              />
            </tr>
          </tbody>
        </table>
        <TradeDocument
          trade={draft}
          editing={editing}
          onChange={(journal) => change('journal', journal)}
        />
      </div>
    </div>
  );
}
