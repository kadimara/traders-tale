import { useTradesContext } from '@lib/context/TradesContext';
import { currentPlanSelect } from '@lib/database/CurrentPlanApi';
import { okxBalance } from '@lib/database/OkxApi';
import { getAccountAfterTrade } from '@lib/utils/TradeUtils';
import { setLocalStorageItem } from './useLocalStorage';

// Adds a planned BTC trade and opens it in edit mode.
export function useNewTrade() {
  const { trades, insertTrade } = useTradesContext();

  return async () => {
    // Trades are sorted newest first
    const prev = trades[0];
    // The live OKX balance; without a working OKX connection, carry the account forward.
    const balance = okxBalance().then(
      ({ totalEq }) => totalEq,
      () => (prev ? getAccountAfterTrade(prev) : 0),
    );
    // The journal starts as a copy of the current plan (edited on the Plan page).
    const plan = currentPlanSelect().then(
      (plan) => plan?.content ?? '',
      () => '',
    );
    const [account, journal] = await Promise.all([balance, plan]);
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
