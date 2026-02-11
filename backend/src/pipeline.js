import fs from 'node:fs/promises'
import { ensureDir, readNdjson, appendNdjson, writeJson } from './fs-utils.js'
import { normalizeScrobble } from './schema.js'
import { buildAnalytics } from './analytics.js'
import { dataDir, outDir, scrobblesFile, analyticsFile } from './paths.js'

export async function ingestFromFile(inputPath) {
  if (!inputPath) {
    throw new Error('Missing input file. Usage: node backend/cli.js ingest <path-to-json>')
  }

  const raw = await fs.readFile(inputPath, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('Input file must be a JSON array of scrobbles')
  }

  const valid = parsed
    .map(normalizeScrobble)
    .filter(Boolean)

  await ensureDir(dataDir)
  await appendNdjson(scrobblesFile, valid)

  return {
    ingested: valid.length,
    skipped: parsed.length - valid.length,
    output: scrobblesFile
  }
}

export async function runBuild() {
  await ensureDir(dataDir)
  await ensureDir(outDir)

  const rows = await readNdjson(scrobblesFile)
  const analytics = buildAnalytics(rows)

  await writeJson(analyticsFile, analytics)

  return {
    processed: rows.length,
    output: analyticsFile
  }
}
