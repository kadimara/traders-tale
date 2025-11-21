import { createContext, useContext, type PropsWithChildren } from 'react';
import { useAsync } from '../hooks/useAsync';
import {
  tradesDelete,
  tradesInsert,
  tradesSelectAll,
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
  updateTrade: (id: number, trade: TradesUpdate) => Promise<void>;
  deleteTrade: (id: number) => Promise<void>;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: PropsWithChildren) {
  const { data, error, loading, setData } = useAsync(tradesSelectAll);

  async function insertTrade(trade: TradesInsert) {
    const insertedTrade = await tradesInsert(trade);
    setData((prev) => [insertedTrade, ...(prev || [])]);
    return insertedTrade;
  }
  async function updateTrade(id: number, trade: TradesUpdate) {
    const updatedTrade = await tradesUpdate(id, trade);
    setData(
      (prev) =>
        prev?.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)) || null
    );
  }
  async function deleteTrade(id: number) {
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
