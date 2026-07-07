import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';
import { isMockMode } from '@lib/mock/mockMode';
import {
  mockMonthlyPlans,
  mockUpdateRow,
  mockDeleteRow,
  MOCK_USER_ID,
} from '@lib/mock/mockData';

export type MonthlyPlanRow =
  Database['public']['Tables']['monthly_plan']['Row'];
export type MonthlyPlanInsert =
  Database['public']['Tables']['monthly_plan']['Insert'];
export type MonthlyPlanUpdate =
  Database['public']['Tables']['monthly_plan']['Update'];

export async function monthlyPlanSelectByMonth(monthYear: string, userId: string) {
  if (isMockMode) {
    return (
      mockMonthlyPlans.find(
        (plan) => plan.month_year === monthYear && plan.user_id === userId,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('monthly_plan')
    .select('*')
    .eq('month_year', monthYear)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function monthlyPlanUpsert(plan: MonthlyPlanInsert) {
  if (isMockMode) {
    const existing = mockMonthlyPlans.find(
      (row) => row.month_year === plan.month_year && row.user_id === plan.user_id,
    );
    if (existing) return mockUpdateRow(mockMonthlyPlans, existing.id, plan);

    const newPlan: MonthlyPlanRow = {
      content: plan.content,
      created_at: plan.created_at ?? new Date().toISOString(),
      id: plan.id ?? crypto.randomUUID(),
      month_year: plan.month_year,
      updated_at: plan.updated_at ?? new Date().toISOString(),
      user_id: plan.user_id ?? MOCK_USER_ID,
    };
    mockMonthlyPlans.push(newPlan);
    return newPlan;
  }

  const { data, error } = await supabase
    .from('monthly_plan')
    .upsert([plan], {
      onConflict: 'month_year,user_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function monthlyPlanUpdate(id: string, plan: MonthlyPlanUpdate) {
  if (isMockMode) return mockUpdateRow(mockMonthlyPlans, id, plan);

  const { data, error } = await supabase
    .from('monthly_plan')
    .update(plan)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function monthlyPlanDelete(id: string) {
  if (isMockMode) return mockDeleteRow(mockMonthlyPlans, id);

  const { error } = await supabase.from('monthly_plan').delete().eq('id', id);
  if (error) throw error;
}
