import type { TradesSpotRow } from '@lib/database/SpotApi';
import type { TradesRow } from '@lib/database/TradesApi';
import { round } from '@lib/utils/MathUtils';

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

export function getTradeLongShort({
  stop,
  entry,
}: TradesRow): 'long' | 'short' {
  return stop < entry ? 'long' : 'short';
}

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

  const feesPayed = (fees ?? 0) * amount; // entry and exit fees
  const pnl = round(amount - (exit / entry) * amount, 2);
  return (long_short == 'long' ? pnl * -1 : pnl) - feesPayed;
}

// test
export function getSpotPnl({ amount, entry, exit }: TradesSpotRow): number {
  if (!exit || !entry) {
    return 0;
  }
  return round(amount * exit - amount * entry, 2);
}

// export function getRiskRewardRatio(entry: number, takeProfit: number, stopLoss: number): string {
// 	const lossDifference = Math.abs(entry - stopLoss);
// 	const profitDifference = Math.abs(entry - takeProfit);

// 	const min = Math.min(lossDifference, profitDifference);

// 	const numerator = Math.round((lossDifference / min) * 10) / 10;
// 	const denominator = Math.round((profitDifference / min) * 10) / 10;

// 	return numerator + ' / ' + denominator;
// }

export function exportTradesToCsv(trades: TradesRow[], monthKey: string) {
  const headers = [
    'date', 'symbol', 'TF', 'L/S', 'account', 'amount',
    'SL', 'entry', 'target', 'exit', 'fees', 'risk', 'PnL', 'executed', 'journal',
  ];

  const escape = (val: unknown) => {
    if (val == null) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows = trades.map((t) => [
    new Date(t.created_at).toLocaleString(),
    t.symbol,
    t.time_frame,
    t.long_short,
    t.account,
    t.amount,
    t.stop,
    t.entry,
    t.target,
    t.exit ?? '',
    t.fees != null ? (t.fees * 100).toFixed(2) + '%' : '',
    t.risk != null ? (t.risk * 100).toFixed(2) + '%' : '',
    t.pnl ?? '',
    t.executed ? 'yes' : 'no',
    t.journal ?? '',
  ].map(escape).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const month = monthKey.slice(0, 7);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `trades-${month}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function getImageSrcFromTradingViewUrl(url: string) {
  if (!url) {
    return '';
  }
  const results = url.match(
    /(?<=https:\/\/www.tradingview.com\/x\/)(.*)(?=\/)/g,
  );
  const result = results?.[0];
  const char = result?.[0]?.toLowerCase();
  return `https://s3.tradingview.com/snapshots/${char}/${result}.png`;
}
