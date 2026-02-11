import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const backendRoot = path.resolve(__dirname, '..')
export const dataDir = path.join(backendRoot, 'data')
export const outDir = path.join(backendRoot, 'out')

export const scrobblesFile = path.join(dataDir, 'scrobbles.ndjson')
export const analyticsFile = path.join(outDir, 'analytics.json')
