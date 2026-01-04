import type { TradesRow } from '@lib/database/TradesApi';
import React from 'react';
import { Module, type ModuleProps } from './Module';

type ModuleWinRateProps = { trades: TradesRow[] } & ModuleProps;

export const ModuleWinRate: React.FC<ModuleWinRateProps> = ({
  trades,
  ...props
}) => {
  const executedTrades = trades.filter((trade) => trade.executed);
  const wins = executedTrades.filter((trade) => (trade.pnl ?? 0) > 0).length;
  const total = executedTrades.length;
  const winPercentage = (wins / total) * 100 || 0;

  return (
    <Module
      className="flex-col align-items-center"
      style={{ alignContent: 'center' }}
      {...props}
    >
      {/* Half moon background */}
      <svg
        viewBox="-4 -4 108 58"
        style={{ overflow: 'visible', maxWidth: '200px' }}
      >
        {/* Background half circle */}
        <path
          d="M 0 50 A 50 50 0 0 1 100 50"
          fill="none"
          stroke="#f23645"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 0 50 A 50 50 0 0 1 100 50"
          fill="none"
          stroke="#089981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(winPercentage / 100) * 157} 157`}
          style={{
            transition: 'stroke-dasharray 0.6s ease-in-out',
          }}
        />
        <text fill="white" x="54" y="35" textAnchor="middle" fontSize="10">
          {winPercentage.toFixed(0)}%
        </text>
        <text fill="white" x="54" y="48" textAnchor="middle" fontSize="8">
          Win rate
        </text>
      </svg>
    </Module>
  );
};
