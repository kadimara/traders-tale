import { Module } from '@lib/components/Module';
import ModuleAverage from '@lib/components/ModuleAverage';
import { ModuleWeek } from '@lib/components/ModuleWeek';
import { ModuleWinLossRatio } from '@lib/components/ModuleWinLossRatio';
import { useTradesContext } from '@lib/context/TradesContext';

export default function Home() {
  const { trades } = useTradesContext();
  return (
    <main
      className="flex flex-col gap-4"
      style={{
        width: '90%',
        margin: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 32,
      }}
    >
      <Module style={{ gridColumn: 'span 3' }}></Module>
      <ModuleWinLossRatio trades={trades} style={{ gridColumn: 'span 3' }} />
      <ModuleAverage trades={trades} style={{ gridColumn: 'span 3' }} />
      <Module style={{ gridColumn: 'span 3' }}></Module>
      <ModuleWeek trades={trades} style={{ gridColumn: 'span 12' }} />
      <Module style={{ gridColumn: 'span 4', gridRow: 'span 4' }}>Notes</Module>
      <Module style={{ gridColumn: 'span 8', gridRow: 'span 2' }}>
        Last chart
      </Module>
    </main>
  );
}
