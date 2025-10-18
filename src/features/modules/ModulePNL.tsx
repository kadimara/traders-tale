import {
  ColorType,
  createChart,
  HistogramSeries,
  type Time,
} from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { useTradesContext } from '../../context/TradesContext';

export default function ModulePNL() {
  const ref = useRef<HTMLDivElement>(null);
  const { trades } = useTradesContext();

  const data = trades
    .reduce((acc, trade) => {
      const time = new Date(trade.created_at).toISOString().split('T')[0];
      const value = trade.pnl ?? 0;
      const index = acc.findIndex((d) => d.time === time);
      if (index !== -1) {
        acc[index].value += value ?? 0;
        acc[index].color = acc[index].value ? '#089981' : '#f23645';
        return acc;
      } else {
        acc.push({ time, value, color: value >= 0 ? '#089981' : '#f23645' });
        return acc;
      }
    }, [] as { time: Time; value: number; color: string }[])
    .reverse();

  const totalPnl = data.reduce((acc, trade) => acc + trade.value, 0);

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

    histogramSeries.setData(data);
    chart.timeScale().setVisibleLogicalRange({
      from: 0,
      to: 6,
    });
    // chart.timeScale().fitContent();
  }, [data]);

  return (
    <div
      className="flex flex-col"
      style={{
        alignSelf: 'flex-start',
        padding: 8,
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius)',
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
      <span style={{ color: 'gray' }}>10/18/2025</span>
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
};
