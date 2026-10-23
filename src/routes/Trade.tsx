import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { tradesSelectById, tradesSubscribe, type TradesRow } from '@lib/database/TradesApi';
import { formatDate } from '@lib/utils/DateUtils';
import { TradeView } from '@lib/components/TradeView';

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

  return (
    <main
      className="flex flex-col gap-4"
      style={{ maxWidth: 1024, margin: '0 auto' }}
    >
      <TradeView
        trade={trade}
        onSaved={setTrade}
        title={<TradeTitle trade={trade} />}
      />
    </main>
  );
}

function TradeTitle({ trade }: { trade: TradesRow }) {
  return (
    <>
      <h1>
        {trade.symbol} ·{' '}
        <span className={trade.long_short}>{trade.long_short}</span>
      </h1>
      <span className="text-muted">
        #{trade.id} · {formatDate(trade.created_at)}
      </span>
    </>
  );
}
