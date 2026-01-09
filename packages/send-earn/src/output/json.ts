import type { DryRunResult } from '../types'

/**
 * JSON output structure.
 */
export interface JsonOutput {
  vaults: {
    address: string
    harvestable: { morpho: string; well: string }
    balance: { morpho: string; well: string }
  }[]
  feeShares: {
    affiliates: {
      vault: string
      feeRecipient: string
      redeemableShares: string
    }[]
    directRecipients: {
      vault: string
      feeRecipient: string
      redeemableShares: string
    }[]
    totals: {
      affiliateShares: string
      directShares: string
    }
  }
  totals: {
    harvestable: { morpho: string; well: string }
    vaultBalances: { morpho: string; well: string }
    sweepable: { morpho: string; well: string }
  }
}

/**
 * Format dry run result as JSON string.
 */
export function formatJson(result: DryRunResult): string {
  const output: JsonOutput = {
    vaults: result.vaults.map((v) => {
      const balance = result.balances.find(
        (b) => b.vault.toLowerCase() === v.vault.toLowerCase()
      ) ?? { morphoBalance: 0n, wellBalance: 0n }

      return {
        address: v.vault,
        harvestable: {
          morpho: v.morphoAmount.toString(),
          well: v.wellAmount.toString(),
        },
        balance: {
          morpho: balance.morphoBalance.toString(),
          well: balance.wellBalance.toString(),
        },
      }
    }),
    feeShares: {
      affiliates: result.feeShares.affiliates.map((a) => ({
        vault: a.vault,
        feeRecipient: a.feeRecipient,
        redeemableShares: a.redeemableShares.toString(),
      })),
      directRecipients: result.feeShares.directRecipients.map((d) => ({
        vault: d.vault,
        feeRecipient: d.feeRecipient,
        redeemableShares: d.redeemableShares.toString(),
      })),
      totals: {
        affiliateShares: result.feeShares.totals.affiliateShares.toString(),
        directShares: result.feeShares.totals.directShares.toString(),
      },
    },
    totals: {
      harvestable: {
        morpho: result.totals.harvestable.morpho.toString(),
        well: result.totals.harvestable.well.toString(),
      },
      vaultBalances: {
        morpho: result.totals.vaultBalances.morpho.toString(),
        well: result.totals.vaultBalances.well.toString(),
      },
      sweepable: {
        morpho: result.totals.sweepable.morpho.toString(),
        well: result.totals.sweepable.well.toString(),
      },
    },
  }

  return JSON.stringify(output, null, 2)
}
