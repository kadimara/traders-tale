import PocketBase from 'pocketbase';

const pocketbaseUrl =
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(pocketbaseUrl);

// The SDK cancels duplicate in-flight requests by default, which breaks
// StrictMode double effects and parallel fetches of the same list.
pb.autoCancellation(false);

/** Id of the logged-in user; throws when nobody is logged in. */
export function currentUserId() {
  const id = pb.authStore.record?.id;
  if (!id) throw new Error('Not authenticated');
  return id;
}
