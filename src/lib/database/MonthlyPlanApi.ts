import { ClientResponseError, type RecordModel } from 'pocketbase';
import { currentUserId, pb } from './PocketBaseClient';

export type MonthlyPlanRow = {
  id: string;
  user: string;
  month_year: string;
  content: string;
  created: string;
  updated: string;
};
export type MonthlyPlanUpdate = Partial<Pick<MonthlyPlanRow, 'month_year' | 'content'>>;

const plans = () => pb.collection('monthly_plan');

const toRow = (record: RecordModel) => record as unknown as MonthlyPlanRow;

const isNotFound = (err: unknown) =>
  err instanceof ClientResponseError && err.status === 404;

export async function monthlyPlanSelectByMonth(monthYear: string) {
  try {
    const record = await plans().getFirstListItem(
      pb.filter('month_year = {:monthYear} && user = {:user}', {
        monthYear,
        user: currentUserId(),
      }),
    );
    return toRow(record);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

// PocketBase has no upsert: update the month's plan if it exists, else create it.
// The unique (user, month_year) index rejects a duplicate create when two saves
// race, in which case the plan now exists and we update it instead.
export async function monthlyPlanUpsert(monthYear: string, content: string) {
  const existing = await monthlyPlanSelectByMonth(monthYear);
  if (existing) return monthlyPlanUpdate(existing.id, { content });

  try {
    const record = await plans().create({
      user: currentUserId(),
      month_year: monthYear,
      content,
    });
    return toRow(record);
  } catch (err) {
    const raced = await monthlyPlanSelectByMonth(monthYear);
    if (!raced) throw err;
    return monthlyPlanUpdate(raced.id, { content });
  }
}

export async function monthlyPlanUpdate(id: string, plan: MonthlyPlanUpdate) {
  const record = await plans().update(id, plan);
  return toRow(record);
}

export async function monthlyPlanDelete(id: string) {
  await plans().delete(id);
}
