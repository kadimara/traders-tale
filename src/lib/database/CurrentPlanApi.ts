import { ClientResponseError, type RecordModel } from 'pocketbase';
import { currentUserId, pb } from './PocketBaseClient';

/** The user's current trading plan; new trades start with it as their journal. */
export type CurrentPlanRow = {
  id: string;
  user: string;
  content: string;
  created: string;
  updated: string;
};

const plans = () => pb.collection('current_plan');

const toRow = (record: RecordModel) => record as unknown as CurrentPlanRow;

const isNotFound = (err: unknown) =>
  err instanceof ClientResponseError && err.status === 404;

export async function currentPlanSelect() {
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

// PocketBase has no upsert: update the plan if it exists, else create it.
// The unique user index rejects a duplicate create when two saves race,
// in which case the plan now exists and we update it instead.
export async function currentPlanUpsert(content: string) {
  const existing = await currentPlanSelect();
  if (existing) return currentPlanUpdate(existing.id, content);

  try {
    const record = await plans().create({ user: currentUserId(), content });
    return toRow(record);
  } catch (err) {
    const raced = await currentPlanSelect();
    if (!raced) throw err;
    return currentPlanUpdate(raced.id, content);
  }
}

async function currentPlanUpdate(id: string, content: string) {
  const record = await plans().update(id, { content });
  return toRow(record);
}
