import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';

type MonthContextType = {
  monthDate: Date;
  setMonthDate: (date: Date) => void;
  monthKey: string;
  monthYear: string;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  handleToday: () => void;
};

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: PropsWithChildren) {
  const today = new Date();
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const monthYear = monthDate
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    })
    .replace(/^./, (c) => c.toUpperCase());

  const monthKey = `${monthDate.getFullYear()}-${String(
    monthDate.getMonth() + 1,
  ).padStart(2, '0')}-01`;

  const handlePrevMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setMonthDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleToday = () => {
    const d = new Date(today);
    d.setDate(1);
    setMonthDate(d);
  };

  return (
    <MonthContext.Provider
      value={{
        monthDate,
        setMonthDate,
        monthKey,
        monthYear,
        handlePrevMonth,
        handleNextMonth,
        handleToday,
      }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonthContext() {
  const ctx = useContext(MonthContext);
  if (!ctx)
    throw new Error('useMonthContext must be used inside MonthProvider');
  return ctx;
}
