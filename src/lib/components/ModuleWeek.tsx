import type { TradesRow } from '@lib/database/TradesApi';
import { toUSD } from '@lib/utils/MathUtils';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';
import { Module, type ModuleProps } from './Module';

type ModuleWeekProps = { trades: TradesRow[] } & ModuleProps;
export function ModuleWeek({ trades, ...props }: ModuleWeekProps) {
  const [week, setWeek] = useState<number>(() => getISOWeekNumber(new Date()));
  const title = getMonthYearLabel(week);

  const today = new Date();
  const year = today.getFullYear();
  const weekStart = getMondayOfISOWeek(week, year);

  return (
    <Module className="flex-col" {...props}>
      <div className="flex align-items-center gap-2">
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div className="flex-1"></div>
        <button onClick={() => setWeek((prev) => prev - 1)}>
          <ChevronLeft />
        </button>
        <button onClick={() => setWeek(getISOWeekNumber(new Date()))}>
          Today
        </button>
        <button onClick={() => setWeek((prev) => prev + 1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const weekday = d.toLocaleDateString(undefined, {
            weekday: 'short',
          });
          const currentDay = d.toDateString() === today.toDateString();
          const dayNum = d.getDate();
          const { totalTrades, totalPnl } = calculateDailyStats(d, trades);
          return (
            <div
              key={i}
              className="flex flex-col flex-1 rounded"
              style={{
                minWidth: 0,
                border: currentDay
                  ? '1px solid var(--color-main)'
                  : '1px solid var(--color-border)',
                padding: 16,
                margin: currentDay ? 0 : 4,
              }}
            >
              <h3>
                {dayNum} {weekday}
              </h3>
              <div
                className={`number${Math.sign(totalPnl)}`}
                style={{ fontWeight: 600 }}
              >
                {toUSD(totalPnl)}
              </div>
              <div>{totalTrades} trades</div>
            </div>
          );
        })}
      </div>
    </Module>
  );
}

const getISOWeekNumber = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // ISO week starts on Monday. Set to nearest Thursday (ISO week year rule).
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
};

const getMondayOfISOWeek = (wk: number, yr: number) => {
  // ISO week 1 contains Jan 4th
  const jan4 = new Date(yr, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1 (Mon) .. 7 (Sun)
  const monday = new Date(jan4);
  // move to Monday of week 1, then add (wk-1) weeks
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (wk - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const isSameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const calculateDailyStats = (date: Date, trades: TradesRow[]) => {
  // compare using local date parts (handles timezone offsets correctly)
  const dailyTrades = trades.filter((trade) => {
    const t = new Date(trade.created_at);
    return isSameLocalDay(t, date);
  });
  const totalPnl = dailyTrades.reduce(
    (acc, trade) => acc + (trade.executed ? trade.pnl || 0 : 0),
    0
  );
  return { totalTrades: dailyTrades.length, totalPnl };
};
const getMonthYearLabel = (week: number) => {
  const yr = new Date().getFullYear();
  const jan4 = new Date(yr, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 1 (Mon) .. 7 (Sun)
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7);
  monday.setHours(0, 0, 0, 0);
  return monday
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase());
};
