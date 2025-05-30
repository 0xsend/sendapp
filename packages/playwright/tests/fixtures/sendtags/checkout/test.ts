import debug from 'debug'
import { test as base } from '../../send-accounts'
import { CheckoutPage } from './page'

export const test = base.extend<{
  checkoutPage: CheckoutPage
}>({
  checkoutPage: async ({ page, injectWeb3Provider, user: { user } }, use) => {
    const { parallelIndex } = test.info()
    const log = debug(`test:checkout:page::${user.id}:${parallelIndex}`)
    log('creating checkoutPage')
    const wallet = await injectWeb3Provider()
    const checkoutPage = new CheckoutPage(page, wallet)
    await use(checkoutPage)
  },
})

export const expect = test.expect
