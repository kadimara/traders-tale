import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'react-feather';
import {
  tradesSelectById,
  type TradesRow,
} from '@lib/database/TradesApi';
import { useTradesContext } from '@lib/context/TradesContext';
import { toUSD } from '@lib/utils/MathUtils';
import { TradeDocument } from '@lib/components/TradeDocument';

const statCellStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const statLabelStyle: React.CSSProperties = {
  color: 'var(--color-text-highlight)',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
};

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

  if (loading) {
    return <div style={{ padding: 32 }}>Loading...</div>;
  }

  if (notFound || !trade) {
    return (
      <div style={{ padding: 32 }}>
        <p>Trade not found.</p>
        <Link to="/">← Home</Link>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1024,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontWeight: 600 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          {trade.symbol} · {trade.time_frame} ·{' '}
          <span className={trade.long_short}>{trade.long_short}</span>
        </h1>
        <span style={{ color: 'var(--color-text-highlight)' }}>
          #{trade.id} · {new Date(trade.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          padding: '12px 0',
          borderTop: '1px solid var(--color-bg-highlight)',
          borderBottom: '1px solid var(--color-bg-highlight)',
        }}
      >
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Account</span>
          <span>{toUSD(trade.account)}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Amount</span>
          <span>{toUSD(trade.amount)}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>SL</span>
          <span>{toUSD(trade.stop)}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Entry</span>
          <span>{toUSD(trade.entry)}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Target</span>
          <span>{toUSD(trade.target)}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Exit</span>
          <span>{toUSD(trade.exit) ?? '—'}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Fees</span>
          <span>
            {trade.fees != null ? (trade.fees * 100).toFixed(2) + '%' : '—'}
          </span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Risk</span>
          <span>
            {trade.risk != null ? (trade.risk * 100).toFixed(2) + '%' : '—'}
          </span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>PnL</span>
          <span
            className={
              trade.executed ? 'number' + Math.sign(trade.pnl ?? 0) : ''
            }
          >
            {toUSD(trade.pnl) ?? '—'}
          </span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Exec</span>
          <span>{trade.executed ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Plan */}
      <TradeDocument trade={trade} onSave={handleSave} />
    </div>
  );
}
