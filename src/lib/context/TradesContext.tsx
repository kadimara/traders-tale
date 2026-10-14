import { createContext, useContext, type PropsWithChildren } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useMonthContext } from './MonthContext';
import {
  tradesDelete,
  tradesInsert,
  tradesSelectByMonth,
  tradesUpdate,
  type TradesInsert,
  type TradesRow,
  type TradesUpdate,
} from '@lib/database/TradesApi';

type TradesContextType = {
  trades: TradesRow[];
  loading: boolean;
  error: Error | null;
  insertTrade: (trade: TradesInsert) => Promise<TradesRow>;
  updateTrade: (id: string, trade: TradesUpdate) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  reloadTrades: () => Promise<void>;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: PropsWithChildren) {
  const { monthKey } = useMonthContext();
  const { data, error, loading, setData } = useAsync(
    () => tradesSelectByMonth(monthKey)
  );

  async function insertTrade(trade: TradesInsert) {
    const insertedTrade = await tradesInsert(trade);
    setData((prev) => [insertedTrade, ...(prev || [])]);
    return insertedTrade;
  }
  async function updateTrade(id: string, trade: TradesUpdate) {
    const updatedTrade = await tradesUpdate(id, trade);
    setData(
      (prev) =>
        prev?.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)) || null
    );
  }
  // Refetch after changes made outside this context, e.g. an OKX sync.
  async function reloadTrades() {
    setData(await tradesSelectByMonth(monthKey));
  }
  async function deleteTrade(id: string) {
    await tradesDelete(id);
    setData((prev) => prev?.filter((trade) => trade.id !== id) || null);
  }

  return (
    <TradesContext.Provider
      value={{
        trades: data || [],
        error,
        loading,
        insertTrade,
        updateTrade,
        deleteTrade,
        reloadTrades,
      }}
    >
      {children}
    </TradesContext.Provider>
  );
}

export function useTradesContext() {
  const ctx = useContext(TradesContext);
  if (!ctx) throw new Error('useTrades must be used inside TradesProvider');
  return ctx;
}
