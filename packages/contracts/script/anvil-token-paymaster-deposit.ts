import 'zx/globals'
$.verbose = true
/**
 * This script is used to deposit into the Entrypoint for TokenPaymaster
 */

const stripControlCharacters = (value: string): string => {
  let result = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (
      code === 0x0a || // \n
      code === 0x0d || // \r
      code === 0x09 || // \t
      code >= 0x20
    ) {
      result += char
    }
  }
  return result
}

const sanitizeCastBigInt = (stdout: string, label: string): string => {
  const cleanOutput = stripControlCharacters(stdout)
  const tokens = cleanOutput
    .split(/\s+/)
    .map((token) => token.replace(/[,;]+$/, ''))
    .filter(Boolean)

  for (let i = tokens.length - 1; i >= 0; i--) {
    const candidate = tokens[i]
    if (/^-?(?:0x)?[0-9a-fA-F]+$/.test(candidate)) {
      try {
        return BigInt(candidate).toString()
      } catch (error) {
        console.warn(chalk.yellow(`Failed to parse ${label} token "${candidate}" as BigInt`), error)
      }
    }
  }

  throw new Error(`Unable to parse numeric output for ${label}. Raw stdout: ${stdout}`)
}

void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url base-local evm_setAutomine true`

  // base mainnet fork
  $.env.PAYMASTER = '0x592e1224D203Be4214B15e205F6081FbbaCFcD2D'
  $.env.DEPOSIT = await $`cast to-wei 100 ether`.then((r) =>
    sanitizeCastBigInt(r.stdout, 'deposit amount')
  )

  console.log(chalk.blue('Adding deposit to paymaster...'), $.env.DEPOSIT)
  await $`forge script ./script/AddTokenPaymasterDeposit.s.sol:AddTokenPaymasterDepositScript \
              -vvvv \
              --fork-url base-local \
              --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
              --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
              --broadcast`

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url base-local evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  await $`cast rpc --rpc-url base-local evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
