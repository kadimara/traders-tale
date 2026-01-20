import type { TradesRow } from '@lib/database/TradesApi';
import React from 'react';
import { Module, type ModuleProps } from './Module';

type ModuleProfitFactorProps = { trades: TradesRow[] } & ModuleProps;

export const ModuleProfitFactor: React.FC<ModuleProfitFactorProps> = ({
  trades,
  className,
  style,
  ...props
}) => {
  const executedTrades = trades.filter((trade) => trade.executed);
  const winningTrades = executedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const losingTrades = executedTrades.filter((t) => (t.pnl ?? 0) <= 0);

  // Profit Factor = Total Profit / Total Loss (absolute)
  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLoss = Math.abs(
    losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  );

  let profitFactor: number | null;

  if (totalLoss === 0 && totalProfit > 0) {
    profitFactor = 9000;
  } else if (totalLoss === 0) {
    profitFactor = 0;
  } else {
    profitFactor = totalProfit / totalLoss;
  }

  // Determine color and status based on profit factor
  const getStatus = (pf: number | null) => {
    const color =
      pf !== null && pf >= 1 ? 'var(--color-long)' : 'var(--color-short)';
    if (pf === null || pf === 0) {
      return { color, status: 'No Wins', visual: '📉' };
    }
    if (pf >= 2) {
      return { color, status: 'Excellent', visual: '🚀' };
    }
    if (pf >= 1.5) {
      return { color, status: 'Very Good', visual: '👍' };
    }
    if (pf >= 1) {
      return { color, status: 'Acceptable', visual: '➡️' };
    }
    return { color, status: 'Needs Work', visual: '⚠️' };
  };

  const { color, status, visual } = getStatus(profitFactor);

  return (
    <Module
      className={className + ' flex-row align-items-center'}
      style={{
        textAlign: 'center',
        justifyContent: 'space-evenly',
        ...style,
      }}
      {...props}
    >
      <div>
        <h1 style={{ fontSize: '4rem', color }}>
          {profitFactor?.toFixed(2) || '0.00'}
        </h1>
        Profit factor
      </div>
      {/* <div>Profit Factor</div> */}
      <div>
        <span style={{ color }}>
          {visual}&nbsp;{status}
        </span>
        <br />
        Wins: ${totalProfit.toFixed(2)}
        <br />
        Losses: ${totalLoss.toFixed(2)}
      </div>
    </Module>
  );
};
