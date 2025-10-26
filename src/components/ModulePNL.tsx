import { ColorType, createChart, HistogramSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useTradesContext } from '../context/TradesContext';

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
startOfWeek.setDate(today.getDate() - today.getDay() - 14); // Start of last week
const endOfWeek = new Date(today);
endOfWeek.setDate(today.getDate() - today.getDay()); // End of current week

const weekDays = getDaysArray(startOfWeek, endOfWeek);

export default function ModulePNL() {
  const ref = useRef<HTMLDivElement>(null);
  const { trades } = useTradesContext();

  const tradesByDay = weekDays.map((day) => {
    const totalValue = trades.reduce((acc, trade) => {
      const tradeDate = new Date(trade.created_at).toISOString().split('T')[0];
      return tradeDate === day ? acc + (trade.pnl ?? 0) : acc;
    }, 0);
    return {
      time: day,
      value: totalValue,
      color: totalValue >= 0 ? '#089981' : '#f23645',
    };
  });

  const totalPnl = tradesByDay.reduce((acc, trade) => acc + trade.value, 0);

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
      <h3 style={{ margin: 0 }}>
        Total PNL
        <strong
          className={'number' + Math.sign(totalPnl)}
          style={{ float: 'inline-end' }}
        >
          {totalPnl > 0 ? '+' : ''}
          {totalPnl.toFixed(2)} USD
        </strong>
      </h3>
      <span style={{ color: 'gray' }}>
        {tradesByDay[tradesByDay.length - 1].time}
      </span>
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
