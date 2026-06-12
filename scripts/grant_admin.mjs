#!/usr/bin/env node
// Grant (or revoke) admin-dashboard access for an account.
//
//   node scripts/grant_admin.mjs <username>            grant
//   node scripts/grant_admin.mjs <username> --revoke   revoke
//
// Uses DATABASE_URL (falls back to the local docker-compose postgres).
// On the EC2 box (where this script isn't in the runtime image), grant via
// the db container instead:
//   sudo docker exec eastbrook-db psql -U eastbrook eastbrook \
//     -c "UPDATE accounts SET is_admin = TRUE WHERE username = 'name';"
import pg from 'pg';

const username = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!username || username.startsWith('--')) {
  console.error('usage: node scripts/grant_admin.mjs <username> [--revoke]');
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://eastbrook:eastbrook_dev_pw@localhost:5433/eastbrook';
const pool = new pg.Pool({ connectionString });

try {
  const res = await pool.query(
    'UPDATE accounts SET is_admin = $2 WHERE username = $1 RETURNING id, username, is_admin',
    [username, !revoke],
  );
  if (res.rowCount === 0) {
    console.error(`no account named "${username}" — they need to register in the game first`);
    process.exit(1);
  }
  const row = res.rows[0];
  console.log(`${row.username} (account ${row.id}) is_admin = ${row.is_admin}`);
} catch (err) {
  console.error('failed:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
