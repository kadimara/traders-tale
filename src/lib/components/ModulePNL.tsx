import { ColorType, createChart, HistogramSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useTradesContext } from '../context/TradesContext';
import { toUSD } from '@lib/utils/MathUtils';

const getDaysArray = (startDate: Date, endDate: Date) => {
  const days: string[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    days.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};

const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay() - 6); // Start of last week
const endOfWeek = new Date(today);
endOfWeek.setDate(today.getDate() - today.getDay() + 7); // End of current week

const weekDays = getDaysArray(startOfWeek, endOfWeek);

export function ModulePNL() {
  const ref = useRef<HTMLDivElement>(null);
  const { trades } = useTradesContext();

  const tradesByDay = weekDays.map((day) => {
    const totalValue = trades
      .filter((t) => t.executed)
      .reduce((acc, trade) => {
        const tradeDate = new Date(trade.created_at)
          .toISOString()
          .split('T')[0];
        return tradeDate === day ? acc + (trade.pnl ?? 0) : acc;
      }, 0);
    return {
      time: day,
      value: totalValue,
      color: totalValue >= 0 ? '#089981' : '#f23645',
    };
  });

  const lastDayWithPnl = [...tradesByDay].reverse().find((t) => t.value != 0);

  useEffect(() => {
    if (ref.current === null) {
      return;
    }
    ref.current.innerHTML = '';
    const chart = createChart(ref.current, config);
    const histogramSeries = chart.addSeries(HistogramSeries, {
      color: '#ffffff',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    histogramSeries.setData(tradesByDay);
    chart.timeScale().fitContent();
  }, [tradesByDay]);

  return (
    <div
      className="flex flex-col"
      style={{
        alignSelf: 'flex-start',
        padding: 16,
        borderRadius: 'var(--border-radius)',
        background: 'var(--color-bg-highlight)',
      }}
    >
      <h4 style={{ margin: 0 }}>
        Daily P&L
        <strong
          className={'number' + Math.sign(lastDayWithPnl?.value ?? 0)}
          style={{ float: 'inline-end' }}
        >
          {toUSD(lastDayWithPnl?.value)}
        </strong>
      </h4>
      <span style={{ color: 'gray' }}>{lastDayWithPnl?.time}</span>
      <div ref={ref}></div>
    </div>
  );
}

const config = {
  width: 400,
  height: 200,
  layout: {
    background: { type: ColorType.Solid, color: '#00000000' }, // chart background
    textColor: '#ffffff', // color of price/axis labels
  },
  grid: {
    vertLines: {
      color: '#ffffff00', // vertical grid lines
    },
    horzLines: {
      color: '#333333', // horizontal grid lines
    },
  },
  handleScroll: false,
  handleScale: false,
};
