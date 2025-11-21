import { SpotTable } from '@lib/components/SpotTable';
import { SpotsProvider } from '@lib/context/SpotContext';

export default function Spot() {
  return (
    <main>
      <SpotsProvider>
        <SpotTable />
      </SpotsProvider>
    </main>
  );
}
