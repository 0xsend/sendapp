import { test as base } from '../auth/test'
import debug from 'debug'
import { CheckoutPage } from './page'

const log = debug('test:fixtures:auth:test')

export const test = base.extend<{
  checkoutPage: CheckoutPage
}>({
  checkoutPage: async ({ page, injectWeb3Provider }, use) => {
    log('creating checkoutPage')
    const wallet = await injectWeb3Provider()
    const checkoutPage = new CheckoutPage(page, wallet)
    await checkoutPage.goto()
    await use(checkoutPage)
  },
})

export const expect = test.expect
