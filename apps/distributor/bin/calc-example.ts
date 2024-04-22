import { Mode, calculatePercentageWithBips, calculateWeights } from '../src/weights'
import { parseArgs } from 'node:util'
import 'zx/globals'

const distAmt = 900000000n // 900,000,000 SEND
const holderPoolBips = 6500n // 65%

const holderPoolAmount = calculatePercentageWithBips(distAmt, holderPoolBips)

const path = `${import.meta.dir}/../balances.json`
console.log('Reading balances from', path)

if (!(await Bun.file(path).exists())) {
  throw new Error(
    `File ${path} does not exist. You can generate one by running distributor with debug logs and re-calculating the shares.`
  )
}

const balances = (await Bun.file(`${import.meta.dir}/../balances.json`).json()) as readonly {
  address: `0x${string}`
  balance: string
}[]

const totalBalance = balances.reduce((acc, balance) => acc + BigInt(balance.balance), 0n)
const numBalances = balances.length

console.log('totalBalance', totalBalance)
console.log('numBalances', numBalances)

const balByAddr = balances.reduce(
  (acc, balance) => {
    acc[balance.address] = balance.balance
    return acc
  },
  {} as Record<string, string>
)

console.log('Calculating weights...', balances.length)

const { totalWeight, weightPerSend, poolWeights, weightedShares } = calculateWeights(
  balances,
  holderPoolAmount,
  Mode.Linear
)

// console.log('totalWeight', totalWeight)
// console.log('weightPerSend', weightPerSend)
// console.log('poolWeights', poolWeights)
// console.log('weightedShares', weightedShares)

const shares = Object.values(weightedShares).sort(
  (a, b) => Number(balByAddr[b.address]) - Number(balByAddr[a.address])
)

console.log('row\taddress\tbalance\tamount\tperc_of_balance\tposition')
shares.map((share, idx) => {
  const addr = share.address
  const bal = Number(balByAddr[addr])
  const perc = ((Number(share.amount) / bal) * 100).toFixed(2)
  const position = Math.floor((Number(bal) / Number(totalBalance)) * numBalances)
  console.log(`${idx + 1}\t${addr}\t${bal}\t${share.amount}\t${perc}%\t${position}`)
})
