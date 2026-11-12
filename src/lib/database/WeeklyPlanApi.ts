import { ClientResponseError, type RecordModel } from 'pocketbase';
import { currentUserId, pb } from './PocketBaseClient';
// Starting point while no weekly plan is saved. Edit the .md file to change it.
import weeklyPlanTemplate from '@lib/templates/WeeklyPlan.md?raw';

export type WeeklyPlanRow = {
  id: string;
  user: string;
  content: string;
  created: string;
  updated: string;
};

const plans = () => pb.collection('weekly_plan');

const toRow = (record: RecordModel) => record as unknown as WeeklyPlanRow;

const isNotFound = (err: unknown) =>
  err instanceof ClientResponseError && err.status === 404;

/** The user's one weekly plan, or null if none is saved yet. */
export async function weeklyPlanSelect() {
  try {
    const record = await plans().getFirstListItem(
      pb.filter('user = {:user}', { user: currentUserId() }),
    );
    return toRow(record);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** The weekly plan's text, or the template while none is saved. */
export async function weeklyPlanContent() {
  const plan = await weeklyPlanSelect();
  return plan?.content || weeklyPlanTemplate;
}

// PocketBase has no upsert: update the user's plan if it exists, else create it.
// The unique user index rejects a duplicate create when two saves race, in
// which case the plan now exists and we update it instead.
export async function weeklyPlanUpsert(content: string) {
  const existing = await weeklyPlanSelect();
  if (existing) return weeklyPlanUpdate(existing.id, content);

  try {
    const record = await plans().create({ user: currentUserId(), content });
    return toRow(record);
  } catch (err) {
    const raced = await weeklyPlanSelect();
    if (!raced) throw err;
    return weeklyPlanUpdate(raced.id, content);
  }
}

async function weeklyPlanUpdate(id: string, content: string) {
  const record = await plans().update(id, { content });
  return toRow(record);
}
