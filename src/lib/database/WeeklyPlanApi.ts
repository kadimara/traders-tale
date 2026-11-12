import { ClientResponseError, type RecordModel } from 'pocketbase';
import { currentUserId, pb } from './PocketBaseClient';

export type WeeklyPlanRow = {
  id: string;
  user: string;
  week_start: string;
  content: string;
  created: string;
  updated: string;
};

const plans = () => pb.collection('weekly_plan');

const toRow = (record: RecordModel) => record as unknown as WeeklyPlanRow;

const isNotFound = (err: unknown) =>
  err instanceof ClientResponseError && err.status === 404;

export async function weeklyPlanSelectByWeek(weekStart: string) {
  try {
    const record = await plans().getFirstListItem(
      pb.filter('week_start = {:weekStart} && user = {:user}', {
        weekStart,
        user: currentUserId(),
      }),
    );
    return toRow(record);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

// PocketBase has no upsert: update the week's plan if it exists, else create it.
// The unique (user, week_start) index rejects a duplicate create when two saves
// race, in which case the plan now exists and we update it instead.
export async function weeklyPlanUpsert(weekStart: string, content: string) {
  const existing = await weeklyPlanSelectByWeek(weekStart);
  if (existing) return weeklyPlanUpdate(existing.id, content);

  try {
    const record = await plans().create({
      user: currentUserId(),
      week_start: weekStart,
      content,
    });
    return toRow(record);
  } catch (err) {
    const raced = await weeklyPlanSelectByWeek(weekStart);
    if (!raced) throw err;
    return weeklyPlanUpdate(raced.id, content);
  }
}

async function weeklyPlanUpdate(id: string, content: string) {
  const record = await plans().update(id, { content });
  return toRow(record);
}
