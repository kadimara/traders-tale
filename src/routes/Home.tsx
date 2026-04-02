import ModuleAverage from '@lib/components/ModuleAverage';
import { ModuleMonth } from '@lib/components/ModuleMonth';
import { ModuleWinRate } from '@lib/components/ModuleWinRate';
import { ModuleProfitFactor } from '@lib/components/ModuleProfitFactor';
import { ModulePlan } from '@lib/components/ModulePlan';
import { useTradesContext } from '@lib/context/TradesContext';
import { useSessionContext } from '@lib/context/SessionContext';
import { useMonthContext } from '@lib/context/MonthContext';
import {
  monthlyPlanSelectByMonth,
  monthlyPlanUpsert,
} from '@lib/database/MonthlyPlanApi';
import { useState, useEffect } from 'react';

export default function Home() {
  const { trades } = useTradesContext();
  const { session } = useSessionContext();
  const { monthDate, monthKey } = useMonthContext();
  const today = new Date();

  // Plan state
  const [planContent, setPlanContent] = useState<string>('');

  // Fetch plan when month changes
  useEffect(() => {
    const fetchPlan = async () => {
      setPlanContent('# Loading...');
      if (!session?.user?.id) {
        return;
      }

      try {
        const existingPlan = await monthlyPlanSelectByMonth(monthKey);
        setPlanContent(existingPlan?.content || '');
      } catch (error) {
        console.error('Failed to fetch plan:', error);
        setPlanContent('');
      }
    };

    fetchPlan();
  }, [monthKey, session?.user?.id]);

  // Handle plan save
  const handlePlanChange = (content: string) => {
    setPlanContent(content);

    if (!session?.user?.id) {
      console.error('User not authenticated');
      return;
    }

    // Save in background
    monthlyPlanUpsert({
      user_id: session.user.id,
      month_year: monthKey,
      content,
    }).catch((error) => {
      console.error('Failed to save plan:', error);
      // Optionally show error toast here
    });
  };

  // Since trades now are filtered by month via TradesContext, no filtering needed
  const filteredTrades = trades;

  // Check if the selected month is previous month (disabled only for past months)
  const isPreviousMonth =
    monthDate.getFullYear() < today.getFullYear() ||
    (monthDate.getFullYear() === today.getFullYear() &&
      monthDate.getMonth() < today.getMonth());

  // Display placeholder when no content
  const displayPlanContent =
    planContent ||
    `# Trading Plan - ${monthDate.toLocaleDateString(undefined, {
      month: 'long',
    })} ${monthDate.getFullYear()}`;

  return (
    <main
      className="flex flex-col gap-4"
      style={{
        width: '90%',
        margin: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 32,
        }}
      >
        <ModuleProfitFactor
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleWinRate
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleAverage
          trades={filteredTrades}
          style={{ gridColumn: 'span 4' }}
        />
        <ModuleMonth
          trades={filteredTrades}
          monthDate={monthDate}
          style={{ gridColumn: 'span 6', gridRow: 'span 6' }}
        />
        <ModulePlan
          key={monthKey}
          value={displayPlanContent}
          onChange={handlePlanChange}
          disabled={isPreviousMonth}
          style={{ gridColumn: 'span 6', gridRow: 'span 6' }}
        />
      </div>
    </main>
  );
}
