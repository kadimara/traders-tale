import type { TradesRow } from '@lib/database/TradesApi';
import { getTradePnl } from '@lib/utils/TradeUtils';

type Props = { trades: TradesRow[] };

export function ModuleDashboardMetrics({ trades }: Props) {
  const executed = trades.filter((t) => t.executed);
  const skipped = trades.filter((t) => !t.executed);

  const netPnl = executed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  const wins = executed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = executed.filter((t) => (t.pnl ?? 0) <= 0);
  const winRate =
    executed.length > 0 ? Math.round((wins.length / executed.length) * 100) : 0;

  const riskyTrades = executed.filter((t) => t.risk != null);
  const avgRisk =
    riskyTrades.length > 0
      ? riskyTrades.reduce((sum, t) => sum + (t.risk ?? 0), 0) /
        riskyTrades.length
      : 0;

  const avgWin =
    wins.length > 0
      ? wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / wins.length
      : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(
          losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / losses.length,
        )
      : 0;
  const rrRatio = avgLoss > 0 ? avgWin / avgLoss : null;

  const missedPnl = skipped.reduce(
    (sum, t) => sum + getTradePnl({ ...t, exit: t.target }),
    0,
  );

  return (
    <>
      <MetricCard
        label="Net P&L"
        value={`${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`}
        valueColor={netPnl >= 0 ? 'var(--color-long)' : 'var(--color-short)'}
        sub="executed trades"
      />
      <MetricCard
        label="Win rate"
        value={`${winRate}%`}
        sub={`${wins.length}W / ${losses.length}L`}
      />
      <MetricCard
        label="Profit / Loss ratio"
        value={rrRatio !== null ? rrRatio.toFixed(2) : '—'}
        valueColor={
          rrRatio !== null && rrRatio >= 1 ? 'var(--color-long)' : undefined
        }
        sub={`$${avgWin.toFixed(2)} / $${avgLoss.toFixed(2)}`}
      />
      <MetricCard
        label="Avg risk"
        value={`${(avgRisk * 100).toFixed(2)}%`}
        sub="per trade"
      />
      <MetricCard
        label="Missed P&L"
        value={`${missedPnl >= 0 ? '+' : ''}$${missedPnl.toFixed(2)}`}
        valueColor="orange"
        sub="skipped setups"
      />
    </>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
};

function MetricCard({ label, value, sub, valueColor }: MetricCardProps) {
  return (
    <div
      className="flex flex-col bg-highlight rounded align-items-center"
      style={{ padding: 16, gap: 4 }}
    >
      <div style={{ opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 600, color: valueColor }}>
        {value}
      </div>
      <div style={{ opacity: 0.5 }}>{sub}</div>
    </div>
  );
}
