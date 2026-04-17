import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit2, Save } from 'react-feather';
import {
  tradesSelectById,
  tradesUpdate,
  type TradesRow,
  type TradesUpdate,
} from '@lib/database/TradesApi';
import { useSessionContext } from '@lib/context/SessionContext';
import { toUSD } from '@lib/utils/MathUtils';
import { MarkdownField } from '@lib/components/MarkdownField';

function composePlan(trade: TradesRow): string {
  const parts: string[] = [];
  if (trade.plan) parts.push(trade.plan);
  if (trade.review && !trade.plan?.includes(trade.review))
    parts.push(trade.review);
  if (trade.url1 && !trade.plan?.includes(trade.url1))
    parts.push(`[Chart 1](${trade.url1})`);
  if (trade.url2 && !trade.plan?.includes(trade.url2))
    parts.push(`[Chart 2](${trade.url2})`);
  return parts.join('\n\n');
}

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
  const { session } = useSessionContext();
  const canEdit = !!session;

  const [trade, setTrade] = useState<TradesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftPlan, setDraftPlan] = useState('');

  useEffect(() => {
    tradesSelectById(Number(id))
      .then(setTrade)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEdit = () => {
    setDraftPlan(composePlan(trade!));
    setEditing(true);
  };

  const handleSave = async () => {
    if (!trade) return;
    const updated = await tradesUpdate(trade.id, {
      plan: draftPlan,
      review: null,
      url1: null,
      url2: null,
    } as TradesUpdate);
    setTrade(updated);
    setEditing(false);
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
        maxWidth: 1280,
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
          gap: '8px 16px',
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
          <span>{trade.fees != null ? (trade.fees * 100).toFixed(2) + '%' : '—'}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Risk</span>
          <span>{trade.risk != null ? (trade.risk * 100).toFixed(2) + '%' : '—'}</span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>PnL</span>
          <span className={trade.executed ? 'number' + Math.sign(trade.pnl ?? 0) : ''}>
            {toUSD(trade.pnl) ?? '—'}
          </span>
        </div>
        <div style={statCellStyle}>
          <span style={statLabelStyle}>Exec</span>
          <span>{trade.executed ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {/* Plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {canEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {editing ? (
              <button aria-label="Save" title="Save" onClick={handleSave}>
                <Save size={16} />
              </button>
            ) : (
              <button aria-label="Edit" title="Edit" onClick={handleEdit}>
                <Edit2 size={16} />
              </button>
            )}
          </div>
        )}
        <div className={editing ? 'document editing' : 'document'}>
          <MarkdownField
            value={editing ? draftPlan : composePlan(trade)}
            editing={editing}
            placeholder="Describe your plan and review. Paste TradingView links to preview charts."
            onChange={setDraftPlan}
          />
        </div>
      </div>
    </div>
  );
}
