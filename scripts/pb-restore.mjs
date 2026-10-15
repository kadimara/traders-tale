// Replaces the local PocketBase data (pocketbase/pb_data) with a snapshot from pocketbase/snapshots:
// the newest one, or the file given as argument (npm run pb:restore -- <file>).
// The current data is kept in pocketbase/pb_data.bak. Afterwards a local superuser is added:
//   PB_LOCAL_EMAIL, PB_LOCAL_PASSWORD  default admin@local.test / 12121212
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';

const snapshotDir = path.resolve('pocketbase/snapshots');
const dataDir = path.resolve('pocketbase/pb_data');
const backupDir = path.resolve('pocketbase/pb_data.bak');

// Overwriting the database while PocketBase has it open would corrupt it.
const running = await fetch('http://127.0.0.1:8090/api/health').then(
  () => true,
  () => false,
);
if (running) {
  console.error('Local PocketBase is running on :8090; stop it first.');
  process.exit(1);
}

// Snapshot names hold a sortable timestamp, so the last one is the newest.
const newest = existsSync(snapshotDir)
  ? readdirSync(snapshotDir).filter((f) => f.endsWith('.zip')).sort().at(-1)
  : undefined;
const snapshotFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : newest && path.join(snapshotDir, newest);
if (!snapshotFile || !existsSync(snapshotFile)) {
  console.error('No snapshot found; run npm run pb:snapshot first.');
  process.exit(1);
}

const files = unzipSync(readFileSync(snapshotFile));
if (!files['data.db']) {
  console.error(`${snapshotFile} is not a PocketBase backup (no data.db).`);
  process.exit(1);
}

if (existsSync(dataDir)) {
  rmSync(backupDir, { recursive: true, force: true });
  renameSync(dataDir, backupDir);
  console.log('Previous data moved to pocketbase/pb_data.bak.');
}
for (const [name, content] of Object.entries(files)) {
  const target = path.join(dataDir, name);
  if (name.endsWith('/')) {
    mkdirSync(target, { recursive: true });
    continue;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
}

console.log(`Restored ${path.basename(snapshotFile)}.`);

// Add a local superuser so the dashboard works without the live login.
const pbBin = path.resolve('pocketbase', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
const adminEmail = process.env.PB_LOCAL_EMAIL || 'admin@local.test';
const adminPassword = process.env.PB_LOCAL_PASSWORD || '12121212';
if (existsSync(pbBin)) {
  execFileSync(pbBin, ['superuser', 'upsert', adminEmail, adminPassword, '--dir', dataDir], { stdio: 'inherit' });
} else {
  console.warn(`No PocketBase binary at ${pbBin}; local superuser not added.`);
}
console.log('OKX keys only decrypt with the Pi\'s okx.key.');
