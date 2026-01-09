// Reads the ../playwright-report/report.json file and outputs a markdown file
import type { TestResult } from '@playwright/test/reporter'
import path from 'node:path'

// Read report path from ENV var, default to ../playwright-report/report.json relative to script dir
const reportJsonPath = process.env.PLAYWRIGHT_REPORT_PATH
  ? path.resolve(process.env.PLAYWRIGHT_REPORT_PATH) // Resolve if absolute or relative path provided
  : path.resolve(import.meta.dir, '../playwright-report/report.json') // Default relative path

// GitHub environment variables for artifact links
const githubRunId = process.env.GITHUB_RUN_ID
const githubRunAttempt = process.env.GITHUB_RUN_ATTEMPT || '1'
const githubRepository = process.env.GITHUB_REPOSITORY || '0xsend/sendapp'

console.error(`Reading report from: ${reportJsonPath}`) // Log to stderr to not pollute markdown output

const file = Bun.file(reportJsonPath)
const report = await file.json().catch((e) => {
  console.error(`Failed to read report from ${reportJsonPath}`, e)
  process.exit(1)
})

// Calculate pass rate
const total = report.stats.expected + report.stats.unexpected + report.stats.flaky
const passRate = total > 0 ? ((report.stats.expected / total) * 100).toFixed(1) : '0'

console.log('# Playwright Report')

// Add artifact download links if running in GitHub Actions
if (githubRunId) {
  const artifactsUrl = `https://github.com/${githubRepository}/actions/runs/${githubRunId}`
  console.log(
    `\n> **Artifacts**: [View all artifacts](${artifactsUrl}#artifacts) | JSON Report: \`json-report--attempt-${githubRunAttempt}\` | HTML Report: \`html-report--attempt-${githubRunAttempt}\``
  )
}

console.log('\n## Summary')

console.log(`
| Passed | Skipped | Failed | Flaky | Duration | Pass Rate |
| ------ | ------- | ------ | ----- | -------- | --------- |
| ${report.stats.expected} | ${report.stats.skipped} | ${report.stats.unexpected} | ${report.stats.flaky} | ${(report.stats.duration / 1000).toFixed(2)}s | **${passRate}%** |
`)

console.log('\n## Suites')

for (const suite of report.suites) {
  // Count results for this suite
  let passed = 0
  let failed = 0
  let skipped = 0
  let flaky = 0

  for (const spec of suite.specs) {
    for (const test of spec.tests) {
      switch (test.status) {
        case 'expected':
          passed++
          break
        case 'unexpected':
          failed++
          break
        case 'skipped':
          skipped++
          break
        case 'flaky':
          flaky++
          break
      }
    }
  }

  const suiteTotal = passed + failed + flaky
  const hasFailures = failed > 0 || flaky > 0
  const statusEmoji = hasFailures ? '❌' : '✅'
  const summaryStats = `${passed}/${suiteTotal} passed`

  // Use details/summary for collapsible sections
  console.log(`\n<details${hasFailures ? ' open' : ''}>`)
  console.log(
    `<summary>${statusEmoji} <strong>${suite.title}</strong> (${summaryStats})</summary>\n`
  )

  // Group specs by title
  const specsByTitle = suite.specs.reduce(
    (acc, spec) => {
      if (!acc[spec.title]) {
        acc[spec.title] = []
      }
      acc[spec.title].push(spec)
      return acc
    },
    {} as Record<string, typeof suite.specs>
  )

  for (const [specTitle, specs] of Object.entries(specsByTitle)) {
    console.log(`#### ${specTitle}`)
    for (const spec of specs) {
      for (const test of spec.tests) {
        const result = test.results[test.results.length - 1] as TestResult // Last result
        const emoji = outcomeToEmoji(test.status)
        console.log(`- ${test.projectName}: ${emoji}`)
        if (test.status === 'unexpected' && result?.errors?.[0]?.message) {
          // Truncate long error messages and escape markdown
          const errorMsg = result.errors[0].message.split('\n')[0].slice(0, 200)
          console.log('  ```')
          console.log(`  ${errorMsg}`)
          console.log('  ```')
        }
      }
    }
  }

  console.log('\n</details>')
}

// outcome status to emoji
function outcomeToEmoji(status: string) {
  // "skipped"|"expected"|"unexpected"|"flaky"
  switch (status) {
    case 'skipped':
      return '⏭️ skipped'
    case 'expected':
      return '✅ passed'
    case 'unexpected':
      return '❌ failed'
    case 'flaky':
      return '🔄 flaky'
    default:
      return '❓ unknown'
  }
}
