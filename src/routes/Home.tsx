import ModuleAverage from '@lib/components/ModuleAverage';
import { ModuleMonth } from '@lib/components/ModuleMonth';
import { ModuleWinRate } from '@lib/components/ModuleWinRate';
import { ModuleProfitFactor } from '@lib/components/ModuleProfitFactor';
import { ModulePlan } from '@lib/components/ModulePlan';
import { useTradesContext } from '@lib/context/TradesContext';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';

export default function Home() {
  const { trades } = useTradesContext();
  const today = new Date();
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const monthYear = monthDate
    .toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    .replace(/^./, (c) => c.toUpperCase());

  const handlePrevMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleToday = () => {
    const d = new Date(today);
    d.setDate(1);
    setMonthDate(d);
  };

  const filteredTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.created_at);
    return (
      tradeDate.getFullYear() === monthDate.getFullYear() &&
      tradeDate.getMonth() === monthDate.getMonth()
    );
  });
  return (
    <main
      className="flex flex-col gap-4"
      style={{
        width: '90%',
        margin: 'auto',
      }}
    >
      <div className="flex align-items-center gap-2">
        <h1 style={{ margin: 0 }}>{monthYear}</h1>
        <div className="flex-1"></div>
        <button onClick={handlePrevMonth}>
          <ChevronLeft />
        </button>
        <button onClick={handleToday}>Today</button>
        <button onClick={handleNextMonth}>
          <ChevronRight />
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 32,
        }}
      >
        <ModuleProfitFactor
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleWinRate
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleAverage
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleMonth
          trades={filteredTrades}
          monthDate={monthDate}
          style={{ gridColumn: 'span 6', gridRow: 'span 6' }}
        />
        <ModulePlan
          monthDate={monthDate}
          style={{ gridColumn: 'span 6', gridRow: 'span 6' }}
        />
      </div>
    </main>
  );
}
