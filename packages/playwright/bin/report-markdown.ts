// Reads the ../playwright-report/report.json file and outputs a markdown file
import type {
  TestCase,
  // FullConfig,
  // FullResult,
  // Reporter,
  // Suite,
  // TestCase,
  TestResult,
} from '@playwright/test/reporter'
const file = Bun.file(`${import.meta.dir}/../playwright-report/report.json`)
const report = await file.json().catch((e) => {
  console.error('Failed to read report.json', e)
  process.exit(1)
})

console.log('# Playwright Report')
console.log('\n## Summary')

console.log(`
| Expected | Skipped | Unexpected | Flaky | Duration |
| -------- | ------- | ---------- | ----- | -------- |
| ${report.stats.expected} | ${report.stats.skipped} | ${report.stats.unexpected} | ${
  report.stats.flaky
}| ${(report.stats.duration / 1000).toFixed(2)}s |
`)

console.log('\n## Suites')

for (const suite of report.suites) {
  console.log(`### ${suite.title}`)

  // Group specs by title
  const specsByTitle = suite.specs.reduce((acc, spec) => {
    if (!acc[spec.title]) {
      acc[spec.title] = []
    }
    acc[spec.title].push(spec)
    return acc
  }, {})
  for (const [specTitle, specs] of Object.entries(specsByTitle)) {
    console.log(`#### ${specTitle}`)
    for (const spec of specs) {
      for (const test of spec.tests) {
        const result = test.results[test.results.length - 1] as TestResult // Last result
        const emoji = o2S(test.status)
        console.log(`- ${test.projectName}: ${emoji}`)
        if (result.status === 'failed') {
          console.log(`  - ${result.errors[0]?.message}`)
        }
      }
    }
  }
}

// result status to emoji
function s2E(status: string) {
  // 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted'
  switch (status) {
    case 'passed':
      return '✅'
    case 'failed':
      return '❌'
    case 'skipped':
      return '⏭'
    case 'timedOut':
      return '⏱'
    case 'interrupted':
      return '🚨'
    default:
      return '😕'
  }
}
// outcome status to emoji
function o2S(status: string) {
  // "skipped"|"expected"|"unexpected"|"flaky"
  switch (status) {
    case 'skipped':
      return '⏭'
    case 'expected':
      return '✅'
    case 'unexpected':
      return '❌'
    case 'flaky':
      return '🚨'
    default:
      return '😕'
  }
}
