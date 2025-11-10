import 'dotenv/config'
import { Client } from 'pg'
import { readFile, readdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { exec as _exec } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(_exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getEnv(name, fallback) {
  const v = process.env[name]
  if (v === undefined || v === '') return fallback
  return v
}

function buildConnectionString() {
  const url = process.env.DATABASE_URL
  if (url && url.startsWith('postgres')) return url
  const host = getEnv('PGHOST', '127.0.0.1')
  const port = getEnv('PGPORT', '5432')
  const db = getEnv('PGDATABASE', 'postgres')
  const user = getEnv('PGUSER', 'postgres')
  const password = getEnv('PGPASSWORD', '')
  const auth = password ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}` : encodeURIComponent(user)
  return `postgres://${auth}@${host}:${port}/${db}`
}

async function waitForPostgres({ timeoutMs, intervalMs }) {
  const start = Date.now()
  const cs = buildConnectionString()
  let lastErr
  while (Date.now() - start < timeoutMs) {
    const client = new Client({ connectionString: cs, statement_timeout: 10000 })
    try {
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      return
    } catch (e) {
      lastErr = e
      try { await client.end() } catch {}
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }
  const err = lastErr || new Error('Timed out waiting for Postgres')
  throw err
}

async function readJSON(filePath) {
  const buf = await readFile(filePath, 'utf8')
  return JSON.parse(buf)
}

async function detectPackageManager(cwd) {
  const candidates = [
    { file: 'pnpm-lock.yaml', cmd: 'pnpm' },
    { file: 'yarn.lock', cmd: 'yarn' },
    { file: 'package-lock.json', cmd: 'npm' }
  ]
  for (const c of candidates) {
    try {
      await access(path.join(cwd, c.file))
      return c.cmd
    } catch {}
  }
  return 'npm'
}

function pickFirstExistingScript(pkg, names) {
  if (!pkg || !pkg.scripts) return null
  for (const n of names) {
    if (pkg.scripts[n]) return n
  }
  return null
}

async function runScriptIfExists(cwd, scriptName) {
  const pm = await detectPackageManager(cwd)
  const cmd = pm === 'yarn' ? `${pm} ${scriptName}` : `${pm} run ${scriptName}`
  await exec(cmd, { cwd, env: process.env, windowsHide: true, timeout: 15 * 60_000, maxBuffer: 10 * 1024 * 1024 })
}

async function runMigrationsFromScripts(cwd, pkg) {
  const migrateScript = pickFirstExistingScript(pkg, [
    'db:migrate',
    'migrate',
    'prisma:migrate',
    'drizzle:migrate',
    'knex:migrate',
    'sequelize:migrate',
    'typeorm:migrate'
  ])
  if (migrateScript) {
    await runScriptIfExists(cwd, migrateScript)
    return true
  }
  return false
}

async function runSeedsFromScripts(cwd, pkg) {
  const seedScript = pickFirstExistingScript(pkg, [
    'db:seed',
    'seed',
    'prisma:seed',
    'drizzle:seed',
    'knex:seed',
    'sequelize:seed',
    'typeorm:seed'
  ])
  if (seedScript) {
    await runScriptIfExists(cwd, seedScript)
    return true
  }
  return false
}

async function ensureMigrationsTable(client) {
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       id SERIAL PRIMARY KEY,
       filename TEXT NOT NULL UNIQUE,
       checksum TEXT NOT NULL,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  )
}

async function fileChecksum(sql) {
  return createHash('sha256').update(sql).digest('hex')
}

async function applySqlMigrations(cwd, client) {
  const migrationsDir = getEnv('MIGRATIONS_DIR', 'migrations')
  const dir = path.isAbsolute(migrationsDir) ? migrationsDir : path.join(cwd, migrationsDir)
  try {
    const files = (await readdir(dir)).filter(f => f.toLowerCase().endsWith('.sql')).sort()
    if (files.length === 0) return false
    await ensureMigrationsTable(client)
    for (const f of files) {
      const full = path.join(dir, f)
      const sql = await readFile(full, 'utf8')
      const checksum = await fileChecksum(sql)
      const res = await client.query('SELECT checksum FROM schema_migrations WHERE filename = $1', [f])
      if (res.rows.length > 0) {
        if (res.rows[0].checksum !== checksum) {
          throw new Error(`Checksum mismatch for migration ${f}`)
        }
        continue
      }
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [f, checksum])
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
    }
    return true
  } catch (e) {
    if (e && e.code === 'ENOENT') return false
    throw e
  }
}

async function applySqlSeeds(cwd, client) {
  const seedsDir = getEnv('SEEDS_DIR', 'seeds')
  const dir = path.isAbsolute(seedsDir) ? seedsDir : path.join(cwd, seedsDir)
  try {
    const files = (await readdir(dir)).filter(f => f.toLowerCase().endsWith('.sql')).sort()
    if (files.length === 0) return false
    for (const f of files) {
      const full = path.join(dir, f)
      const sql = await readFile(full, 'utf8')
      await client.query(sql)
    }
    return true
  } catch (e) {
    if (e && e.code === 'ENOENT') return false
    throw e
  }
}

async function main() {
  const cwd = path.resolve(path.join(__dirname, '..'))
  const isCI = String(process.env.CI || '').toLowerCase() === 'true'
  const waitMs = Number(getEnv('DB_READY_TIMEOUT_MS', isCI ? '120000' : '60000'))
  const intervalMs = Number(getEnv('DB_READY_INTERVAL_MS', '2000'))

  await waitForPostgres({ timeoutMs: waitMs, intervalMs })

  const pkgPath = path.join(cwd, 'package.json')
  let pkg = null
  try { pkg = await readJSON(pkgPath) } catch {}

  let ranMigrations = false
  if (pkg) {
    ranMigrations = await runMigrationsFromScripts(cwd, pkg)
  }

  const client = new Client({ connectionString: buildConnectionString() })
  await client.connect()
  try {
    if (!ranMigrations) {
      await applySqlMigrations(cwd, client)
    }
  } finally {
    await client.end()
  }

  let ranSeeds = false
  if (pkg) {
    ranSeeds = await runSeedsFromScripts(cwd, pkg)
  }

  const client2 = new Client({ connectionString: buildConnectionString() })
  await client2.connect()
  try {
    if (!ranSeeds) {
      await applySqlSeeds(cwd, client2)
    }
  } finally {
    await client2.end()
  }
}

main().catch(err => {
  const isCI = String(process.env.CI || '').toLowerCase() === 'true'
  const msg = err && err.stack ? err.stack : String(err)
  console.error(msg)
  process.exit(isCI ? 1 : 1)
})
