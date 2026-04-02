import { ChevronLeft, ChevronRight } from 'react-feather';
import { useMonthContext } from '../context/MonthContext';

export default function MonthHeader() {
  const { monthYear, handlePrevMonth, handleNextMonth, handleToday } =
    useMonthContext();

  return (
    <div className="flex align-items-center gap-2" style={{ margin: '0 16px' }}>
      <h1 style={{ margin: 0 }}>{monthYear}</h1>
      <div className="flex-1"></div>
      <button onClick={handlePrevMonth} aria-label="Previous month">
        <ChevronLeft />
      </button>
      <button onClick={handleToday}>Today</button>
      <button onClick={handleNextMonth} aria-label="Next month">
        <ChevronRight />
      </button>
    </div>
  );
}
