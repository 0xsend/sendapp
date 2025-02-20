import debug from 'debug'
import { test as base } from '../../send-accounts'
import { AddSendtagsPage } from './page'

export const test = base.extend<{
  addSendtagsPage: AddSendtagsPage
}>({
  addSendtagsPage: async ({ page, injectWeb3Provider, user: { user } }, use) => {
    const { parallelIndex } = test.info()
    const log = debug(`test:addSendtags:page::${user.id}:${parallelIndex}`)
    log('creating addSendtagsPage')
    const wallet = await injectWeb3Provider()
    const addSendtagsPage = new AddSendtagsPage(page, wallet)
    await addSendtagsPage.goto()
    await use(addSendtagsPage)
  },
})

export const expect = test.expect
