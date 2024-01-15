import { type BrowserContext, test as base } from '@playwright/test'
import debug from 'debug'
import { launchChromiumWithMetamask } from './install'
import { MetaMaskPage } from './page'

const log = debug('test:fixtures:metamask:test')

// Customize the context to include metamask extension
export const test = base.extend<{
  context: BrowserContext
  extensionId: string
  metamaskPage: MetaMaskPage
}>({
  // Override context fixture to reuse same worker scoped context
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    log('creating context')
    // Use parallelIndex as a unique identifier for each worker.
    const id = test.info().parallelIndex
    // const userDataDir = await getAuthDirForTest(test.info())
    log('creating context with metamask', `id=${id}`)
    // const context = await launchChromiumWithMetamask(userDataDir)
    const context = await launchChromiumWithMetamask()
    await use(context)
    await context.close()
    log('closed context with metamask', `id=${id}`)
  },
  extensionId: async ({ context }, use) => {
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background) background = await context.waitForEvent('backgroundpage')

    /*
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');
    */

    const extensionId = background.url().split('/')[2]!
    await use(extensionId)
  },
  metamaskPage: async ({ context, extensionId }, use) => {
    const metamaskPage = await MetaMaskPage.build(context, extensionId)
    await use(metamaskPage)
  },
})

export const expect = test.expect
