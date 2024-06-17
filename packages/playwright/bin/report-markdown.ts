// Reads the ../playwright-report/report.json file and outputs a markdown file
import type {
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
}| ${report.stats.duration / 1000}s |
`)

console.log('\n## Suites')

for (const suite of report.suites) {
  console.log(`### ${suite.title}`)

  for (const spec of suite.specs) {
    console.log(`#### ${spec.title} `)
    for (const test of spec.tests) {
      const result = test.results[test.results.length - 1] as TestResult // last result
      if (result.status === 'passed') {
        console.log(`- ${test.projectName}: ✅`)
      } else if (result.status === 'failed') {
        console.log(`- ${test.projectName}: ❌`)
        console.log(`  - ${result.error?.message}`)
      } else if (result.status === 'skipped') {
        console.log(`- ${test.projectName}: ⏭`)
      } else if (result.status === 'timedOut') {
        console.log(`- ${test.projectName}: ⏰`)
      } else if (result.status === 'interrupted') {
        console.log(`- ${test.projectName}: 🚨`)
      } else {
        console.log(`- ${test.projectName}: 😕`)
      }
    }
  }
}
