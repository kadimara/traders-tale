import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useMonthContext } from './MonthContext';
import {
  isTradeInMonth,
  tradesDelete,
  tradesInsert,
  tradesSelectByMonth,
  tradesSubscribe,
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

  // Live updates: apply changes made elsewhere (the server's OKX order check,
  // another tab) to the trades of the shown month, newest first.
  useEffect(() => {
    const unsubscribe = tradesSubscribe((action, trade) => {
      setData((prev) => {
        if (!prev) return prev;
        const others = prev.filter((t) => t.id !== trade.id);
        if (action === 'delete' || !isTradeInMonth(trade, monthKey)) return others;
        return [...others, trade].sort((a, b) => b.created_at.localeCompare(a.created_at));
      });
    });
    return () => {
      unsubscribe.then((fn) => fn());
    };
  }, [monthKey, setData]);

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
