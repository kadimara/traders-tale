import { useEffect } from 'react';
import { Plus } from 'react-feather';
import { tradesSelectPlanned, tradesSubscribe, type TradesRow } from '@lib/database/TradesApi';
import { useAsync } from '@lib/hooks/useAsync';
import { useNewTrade } from '@lib/hooks/useNewTrade';
import { TradeView } from '@lib/components/TradeView';

const isPlanned = (trade: TradesRow) => trade.status === 'planned' || trade.status === 'live';

// Puts a trade in the list, or takes it out once it is no longer planned or live.
function withTrade(list: TradesRow[] | null, changed: TradesRow, deleted = false) {
  const others = (list ?? []).filter((t) => t.id !== changed.id);
  if (deleted || !isPlanned(changed)) return others;
  return [...others, changed].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export default function Plan() {
  const { data, setData } = useAsync(tradesSelectPlanned);
  const newTrade = useNewTrade();

  // The newest planned (or live) trade
  const trade = data?.[0];

  // Live updates, e.g. after sending a trade to OKX or the server's order check.
  useEffect(() => {
    const unsubscribe = tradesSubscribe((action, changed) => {
      setData((prev) => withTrade(prev, changed, action === 'delete'));
    });
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [setData]);

  const handleNew = async () => {
    const created = await newTrade();
    setData((prev) => withTrade(prev, created));
  };

  return (
    <main
      className="flex flex-col gap-4"
      style={{ maxWidth: 1024, margin: '0 auto' }}
    >
      {data && !trade && (
        <>
          <h1>Trade plan</h1>
          <div>
            <button aria-label="New plan" title="New plan" onClick={handleNew}>
              <Plus />
            </button>
          </div>
          <p className="text-muted">No planned trades. Add one to start planning.</p>
        </>
      )}
      {trade && (
        <TradeView
          key={trade.id}
          trade={trade}
          onSaved={(saved) => setData((prev) => withTrade(prev, saved))}
          title={<h1>Trade plan</h1>}
        />
      )}
    </main>
  );
}
