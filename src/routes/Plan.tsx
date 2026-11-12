import { useState } from 'react';
import { Edit, Save, X } from 'react-feather';
import { currentPlanSelect, currentPlanUpsert } from '@lib/database/CurrentPlanApi';
import { useAsync } from '@lib/hooks/useAsync';
import { MarkdownField } from '@lib/components/MarkdownField';

// Market data the plan asks for.
const MARKET_LINKS = [
  { label: 'TradingView', href: 'https://www.tradingview.com/chart/30GXL3z7/' },
  { label: 'Order book', href: 'https://www.coinglass.com/mergev2/BTC-USDT' },
  { label: 'BTC ETF flows', href: 'https://farside.co.uk/btc/' },
  { label: 'Fear & Greed', href: 'https://coinmarketcap.com/charts/fear-and-greed-index/' },
  { label: 'Economic calendar', href: 'https://www.investing.com/economic-calendar' },
];

// The current trading plan. New trades (and OKX imports) start with it as their journal.
export default function Plan() {
  const { data, loading, setData } = useAsync(currentPlanSelect);
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const content = data?.content ?? '';
  const editing = draft !== null;

  const save = async () => {
    if (draft === null) return;
    setSaving(true);
    setSaveError(null);
    try {
      setData(await currentPlanUpsert(draft));
      setDraft(null);
    } catch (err) {
      console.error('Failed to save plan:', err);
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="flex flex-col gap-3"
      style={{ maxWidth: 1024, margin: '0 auto' }}
    >
      <h1>Trade plan</h1>
      <div className="flex flex-wrap gap-3" style={{ alignItems: 'center' }}>
        <nav className="flex flex-wrap gap-3 text-muted">
          {MARKET_LINKS.map(({ label, href }) => (
            <a key={href} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </nav>
        <span className="flex-1" />
        {editing ? (
          <>
            <button aria-label="Save" title="Save" onClick={save} disabled={saving}>
              <Save />
            </button>
            <button aria-label="Cancel" title="Cancel" onClick={() => setDraft(null)}>
              <X />
            </button>
          </>
        ) : (
          <button aria-label="Edit" title="Edit" onClick={() => setDraft(content)} disabled={loading}>
            <Edit />
          </button>
        )}
      </div>
      {saveError && <p style={{ color: 'var(--color-short)' }}>Could not save the plan: {saveError}</p>}
      {!loading && !editing && !content && (
        <p className="text-muted">No plan yet. New trades start with this plan as their journal.</p>
      )}
      <div className="document">
        <MarkdownField
          value={editing ? draft : content}
          editing={editing}
          placeholder="Write your trade plan in markdown..."
          onChange={setDraft}
        />
      </div>
    </main>
  );
}
