import { useEffect, useState } from 'react';
import { Edit, Save, Send, Star, X, XOctagon } from 'react-feather';
import { Link, useParams } from '@tanstack/react-router';
import { tradesSelectById, tradesSubscribe, type TradesRow } from '@lib/database/TradesApi';
import { useTradesContext } from '@lib/context/TradesContext';
import { formatDate } from '@lib/utils/DateUtils';
import { TradeDocument } from '@lib/components/TradeDocument';
import { TradeCells, TradeColumnHeaders } from '@lib/components/TradesTable';
import { useTradeEdit } from '@lib/hooks/useTradeEdit';
import { useOkxOrder } from '@lib/hooks/useOkxOrder';

export default function Trade() {
  const { id } = useParams({ from: '/layout/trade/$id' });
  const [trade, setTrade] = useState<TradesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    tradesSelectById(id)
      .then(setTrade)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Live updates, e.g. after sending the trade to OKX or the server's order check.
  useEffect(() => {
    const unsubscribe = tradesSubscribe((action, changed) => {
      if (changed.id !== id) return;
      if (action === 'delete') setNotFound(true);
      else setTrade(changed);
    });
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [id]);

  if (loading) return <main>Loading...</main>;

  if (notFound || !trade) {
    return (
      <main>
        <p>Trade not found.</p>
        <Link to="/">← Home</Link>
      </main>
    );
  }

  return <TradeView trade={trade} onSaved={setTrade} />;
}

// Already shown in the title.
const hiddenColumns: (keyof TradesRow)[] = ['created_at', 'symbol', 'long_short'];

function TradeView({
  trade,
  onSaved,
}: {
  trade: TradesRow;
  onSaved: (trade: TradesRow) => void;
}) {
  const { updateTrade } = useTradesContext();
  const { send, cancel: cancelOrder, sending } = useOkxOrder();
  // One edit mode for the table row and the journal, saved together.
  const { draft, editing, edit, save, cancel, change } = useTradeEdit(trade, onSaved);

  const handleTogglePlaybook = async () => {
    onSaved(await updateTrade(trade.id, { playbook: !trade.playbook }));
  };

  return (
    <main
      className="flex flex-col gap-4"
      style={{ maxWidth: 1024, margin: '0 auto' }}
    >
      <div className="flex align-items-center gap-2">
        <div className="flex-col gap-2 flex-1">
          <h1>
            {trade.symbol} ·{' '}
            <span className={trade.long_short}>{trade.long_short}</span>
          </h1>
          <span className="text-muted">
            #{trade.id} · {formatDate(trade.created_at)}
          </span>
        </div>
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
        <button
          aria-label={
            trade.playbook ? 'Remove from playbook' : 'Add to playbook'
          }
          title={trade.playbook ? 'Remove from playbook' : 'Add to playbook'}
          onClick={handleTogglePlaybook}
          style={{
            color: trade.playbook ? 'gold' : 'var(--color-muted)',
            background: 'unset',
            border: 'none',
            outline: 'none',
          }}
        >
          <Star
            fill={trade.playbook ? 'currentColor' : 'none'}
            style={{ width: 32, height: 32 }}
          />
        </button>
      </div>
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
    </main>
  );
}
