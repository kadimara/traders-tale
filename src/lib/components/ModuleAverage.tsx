import type { TradesRow } from '@lib/database/TradesApi';
import React from 'react';
import { Module, type ModuleProps } from './Module';

type ModuleAvarageProps = { trades: TradesRow[] } & ModuleProps;

export const ModuleAverage: React.FC<ModuleAvarageProps> = ({
  trades,
  ...props
}) => {
  const winTrades = trades.filter((t) => (t.pnl ?? 0) > 0);
  const lossTrades = trades.filter((t) => (t.pnl ?? 0) < 0);

  // If trades include a percent field, prefer it. Otherwise fall back to pnl value.
  const getPercentage = (t: TradesRow) => {
    return ((t.pnl ?? 0) / t.account) * 100;
  };

  const getAverage = (arr: TradesRow[]) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((s, t) => s + Math.abs(getPercentage(t)), 0);
    return sum / arr.length;
  };

  const avgWin = getAverage(winTrades);
  const avgLoss = getAverage(lossTrades);

  const winX = (avgWin / (avgWin + avgLoss)) * 100 || 0;

  return (
    <Module className="flex-col align-items-center" {...props}>
      <h3>Average</h3>
      <svg
        viewBox="-4 -4 108 24"
        style={{ overflow: 'visible', width: '100%', maxWidth: '200px' }}
      >
        <line
          x1="0"
          y1="2"
          x2="100"
          y2="2"
          stroke="#f23645"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="2"
          x2="100"
          y2="2"
          stroke="#089981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${winX} 157`}
          style={{
            transition: 'stroke-dasharray 0.6s ease-in-out',
          }}
        />
        <text fill="#089981" x="0" y="16" textAnchor="start" fontSize="8">
          Profit {avgWin.toFixed(1)}%
        </text>
        <text fill="#f23645" x="100" y="16" textAnchor="end" fontSize="8">
          Loss {avgLoss.toFixed(1)}%
        </text>
      </svg>
    </Module>
  );
};

export default ModuleAverage;
