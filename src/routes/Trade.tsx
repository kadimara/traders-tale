import { useEffect, useState } from 'react';
import { Star } from 'react-feather';
import { Link, useParams } from '@tanstack/react-router';
import { tradesSelectById, type TradesRow } from '@lib/database/TradesApi';
import { useTradesContext } from '@lib/context/TradesContext';
import { toUSD } from '@lib/utils/MathUtils';
import { TradeDocument } from '@lib/components/TradeDocument';

export default function Trade() {
  const { id } = useParams({ from: '/layout/trade/$id' });
  const { updateTrade } = useTradesContext();
  const [trade, setTrade] = useState<TradesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    tradesSelectById(Number(id))
      .then(setTrade)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (journal: string) => {
    if (!trade) return;
    await updateTrade(trade.id, { journal });
    setTrade((prev) => prev && { ...prev, journal });
  };

  const handleTogglePlaybook = async () => {
    if (!trade) return;
    await updateTrade(trade.id, { playbook: !trade.playbook });
    setTrade((prev) => prev && { ...prev, playbook: !prev.playbook });
  };

  if (loading) return <main>Loading...</main>;

  if (notFound || !trade) {
    return (
      <main>
        <p>Trade not found.</p>
        <Link to="/">← Home</Link>
      </main>
    );
  }

  return (
    <main
      className="flex flex-col gap-4"
      style={{ maxWidth: 1024, margin: '0 auto' }}
    >
      <div className="flex align-items-center gap-2">
        <div className="flex-col gap-2 flex-1">
          <h1>
            {trade.symbol} · {trade.time_frame} ·{' '}
            <span className={trade.long_short}>{trade.long_short}</span>
          </h1>
          <span className="text-muted">
            #{trade.id} · {new Date(trade.created_at).toLocaleDateString()}
          </span>
        </div>
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
            <th>ACCOUNT</th>
            <th>AMOUNT</th>
            <th>SL</th>
            <th>ENTRY</th>
            <th>TARGET</th>
            <th>EXIT</th>
            <th>FEES</th>
            <th>RISK</th>
            <th>PNL</th>
            <th>EXEC</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ pointerEvents: 'none' }}>
            <th>{toUSD(trade.account)}</th>
            <th>{toUSD(trade.amount)}</th>
            <th>{toUSD(trade.stop)}</th>
            <th>{toUSD(trade.entry)}</th>
            <th>{toUSD(trade.target)}</th>
            <th>{toUSD(trade.exit) ?? '—'}</th>
            <th>
              {trade.fees != null ? (trade.fees * 100).toFixed(2) + '%' : '—'}
            </th>
            <th>
              {trade.risk != null ? (trade.risk * 100).toFixed(2) + '%' : '—'}
            </th>
            <th>
              <span
                className={
                  trade.executed ? 'number' + Math.sign(trade.pnl ?? 0) : ''
                }
              >
                {toUSD(trade.pnl) ?? '—'}
              </span>
            </th>
            <th>
              <input type="checkbox" checked={trade.executed} readOnly />
            </th>
          </tr>
        </tbody>
      </table>
      <TradeDocument trade={trade} onSave={handleSave} />
    </main>
  );
}
