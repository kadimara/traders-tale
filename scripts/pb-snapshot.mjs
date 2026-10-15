// Downloads a snapshot of the live PocketBase database to pocketbase/snapshots (gitignored).
// Settings come from .env.local:
//   PB_PROD_EMAIL, PB_PROD_PASSWORD  superuser login on the live server (required)
//   PB_PROD_URL                      default https://api.traders-tale.com
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import PocketBase from 'pocketbase';

const url = process.env.PB_PROD_URL || 'https://api.traders-tale.com';
const email = process.env.PB_PROD_EMAIL;
const password = process.env.PB_PROD_PASSWORD;
const snapshotDir = path.resolve('pocketbase/snapshots');

if (!email || !password) {
  console.error('Set PB_PROD_EMAIL and PB_PROD_PASSWORD in .env.local.');
  process.exit(1);
}

const pb = new PocketBase(url);
await pb.collection('_superusers').authWithPassword(email, password);

// PocketBase makes a consistent copy of pb_data; we only keep it on the server while downloading.
const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const name = `snapshot_${stamp}.zip`;
console.log(`Creating backup ${name} on ${url}...`);
await pb.backups.create(name);
try {
  const token = await pb.files.getToken();
  const res = await fetch(pb.backups.getDownloadURL(token, name));
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  mkdirSync(snapshotDir, { recursive: true });
  writeFileSync(path.join(snapshotDir, name), Buffer.from(await res.arrayBuffer()));
} finally {
  await pb.backups.delete(name);
}

console.log(`Saved pocketbase/snapshots/${name}.`);
