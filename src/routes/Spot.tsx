import { SpotTable } from '@lib/components/SpotTable';
import { SpotsProvider } from '@lib/context/SpotContext';
import MonthHeader from '@lib/components/MonthHeader';

export default function Spot() {
  return (
    <main>
      <MonthHeader />
      <SpotsProvider>
        <SpotTable />
      </SpotsProvider>
    </main>
  );
}
