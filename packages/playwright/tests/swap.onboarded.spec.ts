import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { mergeTests } from '@playwright/test'
import debug from 'debug'
import { expect, test as swapTest } from './fixtures/swap'
import {
  allCoins,
  type coin,
  ethCoin,
  eurcCoin,
  isEthCoin,
  sendCoin,
  usdcCoin,
} from 'app/data/coins'
import { fund } from '@my/playwright/fixtures/viem'
import { formatUnits } from 'viem'
import { ar } from '@faker-js/faker'

const test = mergeTests(swapTest, snapletTest)

const GAS_FEES = BigInt(25 * 10 ** usdcCoin.decimals)

const calculateExchangeRate = (
  inAmount: string,
  outAmount: string,
  inCoin: coin,
  outCoin: coin
) => {
  const exchangeRate = (
    Number(outAmount.replace(',', '')) / Number(inAmount.replace(',', ''))
  ).toFixed(outCoin.formatDecimals)
  return `1 ${inCoin.symbol} = ${exchangeRate} ${outCoin.symbol}`
}

const swapInAmount = {
  [usdcCoin.symbol]: 10000000n,
}

for (const inCoin of [usdcCoin]) {
  for (const outCoin of [sendCoin, ethCoin]) {
    test(`can swap ${inCoin.symbol} for ${outCoin.symbol}`, async ({
      sendAccount,
      page,
      swapFormPage,
      swapSummaryPage,
    }) => {
      test.setTimeout(60_000)

      const inAmount = formatUnits(swapInAmount[inCoin.symbol], inCoin.decimals)
      const slippage = Math.floor(Math.random() * (20 - 2 + 1)) + 2 // from 2% to 20%, lower might make tests flaky

      if (inCoin.symbol === usdcCoin.symbol) {
        await fund({
          address: sendAccount.address as `0x${string}`,
          amount: swapInAmount[inCoin.symbol] + GAS_FEES,
          coin: inCoin,
        })
      } else {
        await fund({
          address: sendAccount.address as `0x${string}`,
          amount: swapInAmount[inCoin.symbol],
          coin: inCoin,
        })
        await fund({
          address: sendAccount.address as `0x${string}`,
          amount: GAS_FEES,
          coin: usdcCoin,
        })
      }

      await swapFormPage.goto()
      await swapFormPage.acceptRiskDialog()
      await swapFormPage.fillSwapForm({
        inAmount,
        inToken: inCoin.symbol,
        outToken: outCoin.symbol,
        customSlippage: slippage.toString(),
      })
      await swapFormPage.waitForSwapRouteResponse()
      const outAmount = await swapFormPage.outAmountInput.inputValue()
      const exchangeRate = calculateExchangeRate(inAmount, outAmount, inCoin, outCoin)

      // start listening before clicking review
      const request = swapFormPage.page.waitForRequest('/api/trpc/swap.encodeSwapRoute?batch=1')

      await swapFormPage.reviewSwap()

      await expect(async () => {
        const currentUrl = new URL(page.url())
        expect(currentUrl.pathname).toBe('/trade/summary')
        const params = currentUrl.searchParams
        expect(params.get('outToken')).toBe(outCoin.token)
        expect(params.get('inToken')).toBe(inCoin.token)
        expect(params.get('inAmount')).toBe(swapInAmount[inCoin.symbol].toString())
        expect(params.get('slippage')).toBe((slippage * 100).toString())
      }).toPass({ timeout: 10000 })

      // validate slippage is still set correctly
      const requestPayload = (await request).postDataJSON()
      expect(requestPayload['0'].json.slippageTolerance).toEqual(slippage * 100)

      // validate summary page
      await swapSummaryPage.validateSummary({
        inAmount: inAmount,
        inToken: inCoin.symbol,
        outToken: outCoin.symbol,
        outAmount,
        exchangeRate,
        slippage,
      })
      await swapSummaryPage.confirmSwap()

      await expect(async () => {
        const currentUrl = new URL(page.url())
        expect(currentUrl.pathname).toBe('/')
        const params = currentUrl.searchParams
        expect(params.get('token')).toBe(outCoin.token)
      }).toPass({
        timeout: isEthCoin(outCoin) ? 20_000 : 10_000,
      })
      const history = page.getByTestId('TokenActivityFeed')
      let attempts = 0
      await expect(async () => {
        if (attempts > 0) {
          await page.reload() // give shovel some time to catch up
        }
        attempts++
        await expect(history).toBeVisible()
        await expect(history.getByText('Trade')).toBeVisible()
        const countCoinSymbols = await history.getByText(outCoin.symbol).count()
        expect(countCoinSymbols).toBe(2)
      }).toPass({ timeout: 20_000 })
    })
  }
}

test('can refresh swap form and preserve filled data', async ({ page, swapFormPage }) => {
  await swapFormPage.goto()
  await swapFormPage.acceptRiskDialog()
  await swapFormPage.fillSwapForm({
    inAmount: '1000',
    inToken: 'SEND',
    outToken: 'SPX',
    customSlippage: '10',
  })
  await swapFormPage.flipTokens()

  await expect(async () => {
    const currentUrl = new URL(page.url())
    const params = currentUrl.searchParams
    expect(params.get('outToken')).toBe('0xEab49138BA2Ea6dd776220fE26b7b8E446638956')
    expect(params.get('inToken')).toBe('0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C')
    expect(params.get('inAmount')).toBe('100000000000')
    expect(params.get('slippage')).toBe('1000')
  }).toPass({ timeout: 10000 })

  await page.reload()
  await swapFormPage.acceptRiskDialog()
  await swapFormPage.validateSwapForm({
    inAmount: '1,000',
    inToken: 'SPX',
    outToken: 'SEND',
    customSlippage: '10',
  })
})

test("can't access form page without accepting risk dialog", async ({ page, swapFormPage }) => {
  // First navigate to home page to establish navigation history
  await page.goto('/')
  await page.waitForURL('/')

  // Then navigate to trade page
  await page.goto('/trade')
  await swapFormPage.validatePageVisible()

  // Close the risk dialog
  await swapFormPage.closeRiskDialog()

  // Should navigate back to home page
  await expect(async () => {
    const currentUrl = new URL(page.url())
    expect(currentUrl.pathname).toBe('/')
  }).toPass({ timeout: 5000 })
})

test("can't access summary page without filling swap form", async ({
  swapSummaryPage,
  swapFormPage,
}) => {
  await swapSummaryPage.goto()
  await swapFormPage.validatePageVisible()
})
