import type { Database } from '@lib/types/database.types';
import { supabase } from './SupabaseClient';

export type MonthlyPlanRow =
  Database['public']['Tables']['monthly_plan']['Row'];
export type MonthlyPlanInsert =
  Database['public']['Tables']['monthly_plan']['Insert'];
export type MonthlyPlanUpdate =
  Database['public']['Tables']['monthly_plan']['Update'];

export async function monthlyPlanSelectByMonth(monthYear: string) {
  const { data, error } = await supabase
    .from('monthly_plan')
    .select('*')
    .eq('month_year', monthYear)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function monthlyPlanUpsert(plan: MonthlyPlanInsert) {
  const { data, error } = await supabase
    .from('monthly_plan')
    .upsert([plan], {
      onConflict: 'month_year',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function monthlyPlanUpdate(id: string, plan: MonthlyPlanUpdate) {
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
  const { error } = await supabase.from('monthly_plan').delete().eq('id', id);
  if (error) throw error;
}
