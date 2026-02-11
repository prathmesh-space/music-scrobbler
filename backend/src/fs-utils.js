import fs from 'node:fs/promises'

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function readNdjson(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    if (!raw.trim()) return []

    return raw
      .split('\n')
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line)
        } catch {
          throw new Error(`Invalid NDJSON at line ${index + 1}`)
        }
      })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

export async function appendNdjson(filePath, records) {
  const serialized = records.map((item) => JSON.stringify(item)).join('\n')
  if (!serialized) return
  const suffix = serialized + '\n'
  await fs.appendFile(filePath, suffix, 'utf8')
}

export async function writeJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}
