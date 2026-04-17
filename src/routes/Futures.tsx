import { TradesTable } from '../lib/components/TradesTable';
import MonthHeader from '@lib/components/MonthHeader';

export default function Futures() {
  return (
    <main>
      <MonthHeader />
      <TradesTable />
    </main>
  );
}
