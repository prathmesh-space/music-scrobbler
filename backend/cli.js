#!/usr/bin/env node
import { ingestFromFile, runBuild } from './src/pipeline.js'

const [, , command, arg] = process.argv

async function main() {
  if (command === 'ingest') {
    const result = await ingestFromFile(arg)
    console.log(`Ingested ${result.ingested} records (${result.skipped} skipped) -> ${result.output}`)
    return
  }

  if (command === 'build') {
    const result = await runBuild()
    console.log(`Built analytics from ${result.processed} records -> ${result.output}`)
    return
  }

  console.log('Usage:')
  console.log('  node backend/cli.js ingest <path-to-json>')
  console.log('  node backend/cli.js build')
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
