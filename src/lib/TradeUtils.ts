import type { TradesRow } from './database/api';
import { round } from './MathUtils';

// export function getTradesPnl(trades: TradesRow[]) {
// 	return parseFloat(
// 		trades
// 			.filter((trade) => trade.status != 'canceled')
// 			.reduce((acc, trade) => acc + trade.pnl, 0)
// 			.toFixed(2)
// 	);
// }

// export function getAvarageAccount(trades: Trade[]) {
// 	return Math.round(
// 		trades
// 			.filter((trade) => trade.status != 'canceled')
// 			.reduce((acc, trade) => acc + trade.account, 0) / trades.length
// 	);
// }

// export function getDefaultTrade(trade: Trade | null = null): Trade {
// 	return {
// 		status: 'created',
// 		date: Date.now(),
// 		link: '',
// 		htfLink: '',
// 		plan: '',
// 		reflection: '',
// 		symbol: trade?.symbol || 'btc',
// 		timeFrame: trade?.timeFrame || '5min',
// 		longShort: 'long',
// 		risk: 0,
// 		riskRewardRatio: '',
// 		account: trade?.account || 0,
// 		amount: 0,
// 		entry: 0,
// 		stopLoss: 0,
// 		pnl: 0
// 	};
// }

export function getTradeRisk(trade: TradesRow): number {
  if (!trade.stop || !trade.entry) {
    return 0;
  }
  const ratio = trade.amount / trade.account;
  const risk = Math.abs(trade.stop / trade.entry - 1);
  return round(ratio * risk, 4);
}

// export function getTradeLongShort(entryPrice: number, stopLoss: number):'long' | 'short' {
// 	return stopLoss < entryPrice ? 'long' : 'short';
// }

// export function getTradePnL({ long_short, entry, exit }: TradesRow): number {
//   if (!entry) {
//     return 0;
//   }

//   const pnl1 = TradeUtils.getPnlExit(exit1, entry, longShort);
//   const pnl2 = TradeUtils.getPnlExit(exit2, entry, longShort);
//   return TradeUtils.round(pnl1 + pnl2, 2);
// }

export function getTradePnl({
  amount,
  entry,
  exit,
  long_short,
  fees,
}: TradesRow): number {
  if (!exit || !entry) {
    return 0;
  }
  const pnl = round(amount - (exit / entry) * amount, 2);
  return (long_short == 'long' ? pnl * -1 : pnl) - (fees || 0);
}

// export function getRiskRewardRatio(entry: number, takeProfit: number, stopLoss: number): string {
// 	const lossDifference = Math.abs(entry - stopLoss);
// 	const profitDifference = Math.abs(entry - takeProfit);

// 	const min = Math.min(lossDifference, profitDifference);

// 	const numerator = Math.round((lossDifference / min) * 10) / 10;
// 	const denominator = Math.round((profitDifference / min) * 10) / 10;

// 	return numerator + ' / ' + denominator;
// }
