import type { TradesRow } from '@lib/database/TradesApi';
import { toUSD } from '@lib/utils/MathUtils';
import { Module, type ModuleProps } from './Module';

type ModuleMonthProps = { trades: TradesRow[]; monthDate: Date } & ModuleProps;
export function ModuleMonth({ trades, monthDate, ...props }: ModuleMonthProps) {
  const today = new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get the day of week for the 1st (0 = Sunday, 1 = Monday, ... 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  // Calculate how many days back to Sunday
  // If Sunday (0): go back 0 days, otherwise go back to the previous Sunday
  const daysBackToSunday = firstDayOfWeek;

  // Start date is the Sunday of the week containing the 1st
  const startDate = new Date(year, month, 1 - daysBackToSunday);

  // Calculate end date to complete the last week (end on Saturday)
  const endOfMonthDay = lastDay.getDay();
  const daysToSaturday = endOfMonthDay === 6 ? 0 : 6 - endOfMonthDay;

  const totalDays = daysBackToSunday + daysInMonth + daysToSaturday;
  const allDays = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  return (
    <Module className="flex-col" {...props}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
        }}
      >
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div
            key={day}
            style={{
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {day}
          </div>
        ))}
        {allDays.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const dayNum = d.getDate();
          const isToday = isSameLocalDay(d, today);
          const { totalTrades, totalPnl } = calculateDailyStats(d, trades);
          return (
            <div
              key={i}
              className={`flex flex-col align-items-center rounded background-number${Math.sign(
                totalPnl
              )}`}
              style={{
                padding: '24px 16px',
                opacity: isCurrentMonth ? 1 : 0.4,
                position: 'relative',
                fontWeight: isToday ? 600 : 'inherit',
              }}
            >
              <span style={{ position: 'absolute', top: 4, right: 6 }}>
                {dayNum}
              </span>
              <span
                className={`number${Math.sign(totalPnl)}`}
                style={{ fontWeight: 600, fontSize: 16 }}
              >
                {toUSD(totalPnl)}
              </span>
              <span>{totalTrades} trades</span>
            </div>
          );
        })}
      </div>
    </Module>
  );
}

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
