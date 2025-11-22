import { Module } from '@lib/components/Module';
import { ModuleWeek } from '@lib/components/ModuleWeek';
import { useTradesContext } from '@lib/context/TradesContext';

export default function Home() {
  const { trades } = useTradesContext();
  const filteredTrades = trades.filter((trade) => trade.executed);
  return (
    <main
      className="flex flex-col gap-4"
      style={{
        width: '90%',
        margin: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 32,
      }}
    >
      <Module style={{ gridColumn: 'span 2' }}>Streak</Module>
      <Module style={{ gridColumn: 'span 2' }}>Win loss ratio</Module>
      <Module style={{ gridColumn: 'span 2' }}>Average win</Module>
      <Module style={{ gridColumn: 'span 2' }}>Average loss</Module>
      <ModuleWeek trades={filteredTrades} style={{ gridColumn: 'span 8' }} />
      <Module style={{ gridColumn: 'span 3', gridRow: 'span 4' }}>Notes</Module>
      <Module style={{ gridColumn: 'span 5', gridRow: 'span 2' }}>
        Last chart
      </Module>
    </main>
  );
}
