import { useTradesContext } from '@lib/context/TradesContext';
import type { TradesRow, TradesUpdate } from '@lib/database/TradesApi';
import {
  contractsToUsd,
  getContractSize,
  getTradeAmountForRisk,
  getTradeLongShort,
  getTradePnl,
  getTradeRisk,
  usdToContracts,
} from '@lib/utils/TradeUtils';
import { useLocalStorage } from './useLocalStorage';

// Edit state of one trade: unsaved changes live in localStorage (`trade<id>`),
// so they survive reloads and are shared by the trades table and the trade page.
// Changes recalculate the size, direction, risk and PnL.
export function useTradeEdit(trade: TradesRow, onSaved?: (trade: TradesRow) => void) {
  const { updateTrade } = useTradesContext();
  const [tradeLocal, setTradeLocal] =
    useLocalStorage<Partial<TradesRow> | null>(`trade${trade.id}`, null);

  const edit = () => {
    setTradeLocal({});
  };
  const save = async () => {
    if (tradeLocal && Object.keys(tradeLocal).length > 0) {
      const saved = await updateTrade(trade.id, {
        ...tradeLocal,
      } as TradesUpdate);
      onSaved?.(saved);
    }
    setTradeLocal(null);
  };
  const cancel = () => {
    setTradeLocal(null);
  };

  const change = (key: keyof TradesRow, value: unknown) => {
    setTradeLocal((prev) => {
      const local = { ...prev, [key]: value };
      const contractSize = getContractSize(local.symbol ?? trade.symbol);
      const prevEntry = prev?.entry ?? trade.entry;
      const planned = (local.status ?? trade.status) === 'planned';
      // Planned trades always size from the fixed risk; others only while no amount is set
      if (key !== 'amount' && (planned || !(prev?.amount ?? trade.amount))) {
        const amount = getTradeAmountForRisk({ ...trade, ...local });
        if (amount !== undefined) local.amount = amount;
      } else if (key === 'entry' && prev?.amount && contractSize && prevEntry) {
        // Keep the contract count when the entry changes after contracts were entered
        const contracts = usdToContracts(prev.amount, contractSize, prevEntry);
        local.amount = contractsToUsd(contracts, contractSize, value as number);
      }
      const combined = { ...trade, ...local };
      const long_short = getTradeLongShort({ ...combined });
      const risk = getTradeRisk({ ...combined, long_short });
      const pnl = getTradePnl({ ...combined, risk, long_short });
      return {
        ...local,
        long_short,
        risk,
        pnl,
      };
    });
  };

  return {
    draft: { ...trade, ...tradeLocal },
    editing: tradeLocal !== null,
    edit,
    save,
    cancel,
    change,
  };
}
