import { TradesTable } from '../lib/components/TradesTable';
import MonthHeader from '@lib/components/MonthHeader';

export default function Journal() {
  return (
    <main>
      <MonthHeader />
      <TradesTable />
    </main>
  );
}
