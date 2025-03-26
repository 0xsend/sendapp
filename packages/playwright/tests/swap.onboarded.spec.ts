import { test as snapletTest } from '@my/playwright/fixtures/snaplet'
import { mergeTests } from '@playwright/test'
import debug from 'debug'
import { expect, test as swapTest } from './fixtures/swap'
import {
  allCoins,
  type coin,
  ethCoin,
  isEthCoin,
  sendCoin,
  spx6900Coin,
  usdcCoin,
} from 'app/data/coins'
import { fund } from '@my/playwright/fixtures/viem'
import { formatUnits } from 'viem'

let log: debug.Debugger

const test = mergeTests(swapTest, snapletTest)

const GAS_FEES = BigInt(25 * 10 ** usdcCoin.decimals)

const calculateExchangeRate = (
  inAmount: string,
  outAmount: string,
  inCoin: coin,
  outCoin: coin
) => {
  const exchangeRate = Number(outAmount.replace(',', '')) / Number(inAmount.replace(',', ''))
  return `1 ${inCoin.symbol} = ${exchangeRate} ${outCoin.symbol}`
}

const swapInAmount = {
  [usdcCoin.symbol]: 10000000n,
  [ethCoin.symbol]: 10000000000000000n,
  [sendCoin.symbol]: 100000000000000000000n,
  [spx6900Coin.symbol]: 10000000000n,
}

for (const inCoin of allCoins) {
  for (const outCoin of allCoins) {
    if (inCoin.symbol === outCoin.symbol) {
      continue
    }

    test(`can swap ${inCoin.symbol} for ${outCoin.symbol}`, async ({
      sendAccount,
      page,
      swapFormPage,
      swapSummaryPage,
    }) => {
      log = debug(
        `test:swap:can-swap:${inCoin.symbol}:${outCoin.symbol}:${test.info().parallelIndex}`
      )
      const inAmount = formatUnits(swapInAmount[inCoin.symbol], inCoin.decimals)

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
      await swapFormPage.fillSwapForm({
        inAmount,
        inToken: inCoin.symbol,
        outToken: outCoin.symbol,
        customSlippage: '3',
      })
      await swapFormPage.waitForSwapRouteResponse()
      const outAmount = await swapFormPage.outAmountInput.inputValue()
      const exchangeRate = calculateExchangeRate(inAmount, outAmount, inCoin, outCoin)
      await swapFormPage.reviewSwap()
      await page.waitForURL(
        `/swap/summary?outToken=${outCoin.token}&inToken=${inCoin.token}&inAmount=${
          swapInAmount[inCoin.symbol]
        }&slippage=300`
      )
      await swapSummaryPage.validateSummary({
        inAmount: inAmount,
        inToken: inCoin.symbol,
        outToken: outCoin.symbol,
        outAmount,
        exchangeRate,
        slippage: '3%',
      })
      await swapSummaryPage.confirmSwap()

      await page.waitForURL(`/?token=${outCoin.token}`, {
        timeout: isEthCoin(outCoin) ? 10_000 : undefined,
      })
      const history = page.getByTestId('TokenActivityFeed')
      await expect(history).toBeVisible()
      await expect(history.getByText('Bought')).toBeVisible()
      const countCoinSymbols = await history.getByText(outCoin.symbol).count()
      expect(countCoinSymbols).toBe(2)
      await expect(history.getByText('1 min ago')).toBeVisible()
    })
  }
}

test('can refresh swap form and preserve filled data', async ({ page, swapFormPage }) => {
  log = debug(`test:swap:form-refresh:${test.info().parallelIndex}`)
  await swapFormPage.goto()
  await swapFormPage.fillSwapForm({
    inAmount: '1000',
    inToken: 'SEND',
    outToken: 'SPX',
    customSlippage: '10',
  })
  await swapFormPage.flipTokens()
  await page.waitForURL(
    '/swap?outToken=0xEab49138BA2Ea6dd776220fE26b7b8E446638956&inToken=0x50dA645f148798F68EF2d7dB7C1CB22A6819bb2C&inAmount=100000000000&slippage=1000'
  )
  await page.reload()
  await swapFormPage.validateSwapForm({
    inAmount: '1,000',
    inToken: 'SPX',
    outToken: 'SEND',
    customSlippage: '10',
  })
})

// TODO
// test("risk modal won't show after accepting it and refreshing the page", async () => {})

test("can't access summary page without filling swap form", async ({
  swapSummaryPage,
  swapFormPage,
}) => {
  log = debug(`test:swap:summary-access:${test.info().parallelIndex}`)
  await swapSummaryPage.goto()
  await swapFormPage.validatePageVisible()
})
