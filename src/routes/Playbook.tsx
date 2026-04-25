import type { TradesRow } from '@lib/database/TradesApi';
import { tradesSelectPlaybook } from '@lib/database/TradesApi';
import { useAsync } from '@lib/hooks/useAsync';
import { Link } from '@tanstack/react-router';

function pnlPct(pnl: number, account: number): string {
  const pct = (pnl / account) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// Strips markdown syntax from the journal and returns a plain-text excerpt.
function journalExcerpt(journal: string | null, max = 120): string {
  if (!journal) return '';
  const plain = journal
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images  ![alt](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links [text](url) → text
    .replace(/#{1,6}\s+/g, '') // remove heading markers # ## ###
    .replace(/[*_]{1,3}([^*_\n]+)[*_]{1,3}/g, '$1') // bold/italic **x** _x_ → x
    .replace(/`[^`]+`/g, '') // remove inline code `x`
    .replace(/\n+/g, ' ') // collapse newlines to spaces
    .trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

function PlaybookCard({ trade }: { trade: TradesRow }) {
  const excerpt = journalExcerpt(trade.journal);
  const pnlSign = Math.sign(trade.pnl ?? 0);

  return (
    <Link
      className="playbook-card"
      to="/trade/$id"
      params={{ id: String(trade.id) }}
    >
      <div className="flex align-items-center justify-between gap-2">
        <h3 style={{ margin: 0, fontSize: '2rem' }}>
          {trade.symbol}{' '}
          <span className="text-muted" style={{ fontWeight: 300 }}>
            · {trade.time_frame}
          </span>
        </h3>
        <span
          className={`direction-badge ${trade.long_short} background-${trade.long_short}`}
        >
          {trade.long_short}
        </span>
      </div>

      <span className="text-muted" style={{ fontSize: '1.2rem' }}>
        #{trade.id} · {new Date(trade.created_at).toLocaleDateString()}
      </span>

      <p
        className="text-muted flex-1"
        style={{ margin: 0, fontSize: '1.3rem', lineHeight: 1.6, flex: 1 }}
      >
        {excerpt}
      </p>

      {trade.pnl != null && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <span className={`number${pnlSign}`} style={{ fontWeight: 700 }}>
            {pnlPct(trade.pnl, trade.account)}
          </span>
        </div>
      )}
    </Link>
  );
}

export default function Playbook() {
  const { data: trades } = useAsync(tradesSelectPlaybook);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2.4rem' }}>Playbook</h1>

      {trades && trades.length === 0 && (
        <p className="text-muted">
          No playbook trades yet. Star a trade from its detail page to add it
          here.
        </p>
      )}

      {trades && trades.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {trades.map((trade) => (
            <PlaybookCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </main>
  );
}
