/**
 * This file is used to generate the playwright code for the metamask tests.
 * Or it can be copied and pasted into a repl for programmatic control of the browser.
 */
import { launchChromiumWithMetamask } from '../tests/fixtures/metamask'

process.env.HEADFULL = '1'

// https://playwright.dev/docs/codegen#record-using-custom-setup
// Useful for non-extension pages, otherwise playwright won't be able to record the events.
;(async () => {
  // Make sure to run headed.
  const context = await launchChromiumWithMetamask()

  // Setup context however you like.
  // const context = await browser.newContext({
  //   /* pass any options */
  // })
  // await context.route('**/*', (route) => route.continue())

  // Pause the page, and start recording manually.
  const page = await context.newPage()
  await page.pause()
})()
