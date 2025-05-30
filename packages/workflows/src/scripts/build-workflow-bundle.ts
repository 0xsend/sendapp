import { bundleWorkflowCode } from '@temporalio/worker'
import { mkdir, writeFile } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
import { fileURLToPath } from 'node:url'

export const __filename = fileURLToPath(import.meta.url)
export const __dirname = dirname(__filename)

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../all-workflows.ts'),
    payloadConverterPath: require.resolve('@my/temporal/payload-converter'),
  })
  const codePath = path.join(__dirname, '../../dist/workflow-bundle.js')

  await mkdir(dirname(codePath), { recursive: true })

  await writeFile(codePath, code)
  console.log(`Bundle written to ${codePath}`)
}

await bundle()
