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

  const [planContent, setPlanContent] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    monthlyPlanSelectByMonth(monthKey, session.user.id)
      .then((plan) => setPlanContent(plan?.content ?? ''))
      .catch((err) => console.error('Failed to fetch plan:', err));
  }, [monthKey, session?.user?.id]);

  const handlePlanChange = (content: string) => {
    if (!session?.user?.id) return;
    setPlanContent(content);
    monthlyPlanUpsert({ user_id: session.user.id, month_year: monthKey, content }).catch(
      (err) => console.error('Failed to save plan:', err)
    );
  };

  const today = new Date();
  const isPreviousMonth =
    monthDate.getFullYear() < today.getFullYear() ||
    (monthDate.getFullYear() === today.getFullYear() &&
      monthDate.getMonth() < today.getMonth());

  const monthLabel = monthDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <main style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
        <ModuleProfitFactor trades={trades} />
        <ModuleWinRate trades={trades} />
        <ModuleAverage trades={trades} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))', gap: 16 }}>
        <ModuleMonth trades={trades} monthDate={monthDate} />
        <ModulePlan
          key={monthKey}
          value={planContent}
          onChange={handlePlanChange}
          disabled={isPreviousMonth}
          placeholder={`# Trading Plan — ${monthLabel}\n\nWrite your plan here...`}
        />
      </div>
    </main>
  );
}
