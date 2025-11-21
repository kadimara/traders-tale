import {
  tradesSpotDelete,
  tradesSpotInsert,
  tradesSpotSelectAll,
  tradesSpotUpdate,
  type TradesSpotInsert,
  type TradesSpotRow,
  type TradesSpotUpdate,
} from '@lib/database/SpotApi';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { useAsync } from '../hooks/useAsync';

type SpotContextType = {
  trades: TradesSpotRow[];
  loading: boolean;
  error: Error | null;
  insertTrade: (trade: TradesSpotInsert) => Promise<TradesSpotRow>;
  updateTrade: (id: number, trade: TradesSpotUpdate) => Promise<void>;
  deleteTrade: (id: number) => Promise<void>;
};

const SpotContext = createContext<SpotContextType | undefined>(undefined);

export function SpotsProvider({ children }: PropsWithChildren) {
  const { data, error, loading, setData } = useAsync(tradesSpotSelectAll);

  async function insertTrade(trade: TradesSpotInsert) {
    const insertedTrade = await tradesSpotInsert(trade);
    setData((prev) => [insertedTrade, ...(prev || [])]);
    return insertedTrade;
  }
  async function updateTrade(id: number, trade: TradesSpotUpdate) {
    const updatedTrade = await tradesSpotUpdate(id, trade);
    setData(
      (prev) =>
        prev?.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)) || null
    );
  }
  async function deleteTrade(id: number) {
    await tradesSpotDelete(id);
    setData((prev) => prev?.filter((trade) => trade.id !== id) || null);
  }

  return (
    <SpotContext.Provider
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
    </SpotContext.Provider>
  );
}

export function useSpotContext() {
  const ctx = useContext(SpotContext);
  if (!ctx) throw new Error('useSpotContext must be used inside SpotProvider');
  return ctx;
}
