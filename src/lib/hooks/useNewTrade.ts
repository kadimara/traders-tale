import { useTradesContext } from '@lib/context/TradesContext';
import { okxBalance } from '@lib/database/OkxApi';
import { weeklyPlanContent } from '@lib/database/WeeklyPlanApi';
import { getAccountAfterTrade } from '@lib/utils/TradeUtils';
// Default journal for new trades. Edit the .md file to change it; {{weekly_plan}}
// is replaced by a copy of the weekly plan as it is when the trade is made.
import tradePlanTemplate from '@lib/templates/TradePlan.md?raw';
import weeklyPlanTemplate from '@lib/templates/WeeklyPlan.md?raw';
import { setLocalStorageItem } from './useLocalStorage';

// Adds a planned BTC trade and opens it in edit mode.
export function useNewTrade() {
  const { trades, insertTrade } = useTradesContext();

  return async () => {
    // Trades are sorted newest first
    const prev = trades[0];
    // The live OKX balance; without a working OKX connection, carry the account forward.
    const account = await okxBalance().then(
      ({ totalEq }) => totalEq,
      () => (prev ? getAccountAfterTrade(prev) : 0),
    );
    // Without the weekly plan (e.g. offline), its template still gives the sections.
    const weeklyPlan = await weeklyPlanContent().catch(() => weeklyPlanTemplate);
    const journal = tradePlanTemplate.replace('{{weekly_plan}}', weeklyPlan.trim());
    const trade = await insertTrade({
      account,
      amount: 0,
      entry: 0,
      journal,
      long_short: 'long',
      stop: 0,
      status: 'planned',
      symbol: 'BTC',
    });
    setLocalStorageItem(`trade${trade.id}`, {});
    return trade;
  };
}
