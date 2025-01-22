import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
  isAddress,
  getAddress,
  createWalletClient,
  http,
  publicActions,
  getContract,
  parseEther,
} from 'viem'
import type { PrivateKeyAccount } from 'viem/accounts'
import { baseMainnet } from '@my/wagmi/chains'
import { baseMainnetClient } from 'app/utils/viem'
import { privateKeyToAccount } from 'viem/accounts'
import { assert } from 'app/utils/assert'
import { erc20Abi, sendTokenAddress, sendTokenV0Address, usdcAddress } from '@my/wagmi'
import { waitForTransactionReceipt } from 'viem/actions'

export const secretShopRouter = createTRPCRouter({
  fund: protectedProcedure
    .input(
      z.object({
        address: z.string().regex(/^0x[0-9a-f]{40}$/i),
      })
    )
    .mutation(async ({ input: { address: addressInput } }) => {
      if (!isAddress(addressInput, { strict: false })) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid address.' })
      }
      const address = getAddress(addressInput)

      assert(!!process.env.SECRET_SHOP_PRIVATE_KEY, 'SECRET_SHOP_PRIVATE_KEY is required')

      let secretShopAccount: PrivateKeyAccount
      try {
        secretShopAccount = privateKeyToAccount(
          process.env.SECRET_SHOP_PRIVATE_KEY as `0x${string}`
        )
        console.log('secretShopAccount', secretShopAccount.address)
      } catch (e) {
        if (e instanceof Error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e.message })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Unknown error' })
      }

      const secretShopClient = createWalletClient({
        account: secretShopAccount,
        chain: baseMainnet,
        transport: http(baseMainnetClient.transport.url),
      }).extend(publicActions)

      const sendToken = getContract({
        abi: erc20Abi,
        address: sendTokenAddress[baseMainnet.id],
        client: secretShopClient,
      })
      const sendV0Token = getContract({
        abi: erc20Abi,
        address: sendTokenV0Address[baseMainnet.id],
        client: secretShopClient,
      })
      const usdcToken = getContract({
        abi: erc20Abi,
        address: usdcAddress[baseMainnet.id],
        client: secretShopClient,
      })

      const [ethBal, sendBal, sendV0Bal, usdcBal, ssEthBal, ssUsdcBal, ssSendBal, ssSendV0Bal] =
        await Promise.all([
          secretShopClient.getBalance({ address }),
          sendToken.read.balanceOf([address]),
          sendV0Token.read.balanceOf([address]),
          usdcToken.read.balanceOf([address]),
          secretShopClient.getBalance({ address: secretShopAccount.address }),
          usdcToken.read.balanceOf([secretShopAccount.address]),
          sendToken.read.balanceOf([secretShopAccount.address]),
          sendV0Token.read.balanceOf([secretShopAccount.address]),
        ] as const)

      // fund account where balances are low

      // eth
      let ethTxHash: string | null = null
      const eth = parseEther('0.05')
      if (ssEthBal < eth + BigInt(1e6)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient ETH in secret shop' })
      }
      if (ethBal < eth) {
        await secretShopClient
          .sendTransaction({
            to: address,
            value: eth - ethBal, // only transfer the difference
            chain: baseMainnet,
          })
          .then((hash) => {
            return waitForTransactionReceipt(secretShopClient, {
              hash,
            })
          })
          .then((receipt) => {
            ethTxHash = receipt.transactionHash
          })
          .catch((e) => {
            ethTxHash = e.message
          })
      }
      // usdc
      let usdcTxHash: string | null = null
      const usdc = BigInt(50e6) // $50 worth of USDC
      if (usdcBal < usdc) {
        if (ssUsdcBal < usdc) {
          usdcTxHash = 'Error: Insufficient USDC in secret shop'
        } else {
          await usdcToken.write
            // only transfer the difference
            .transfer([address, usdc - usdcBal], {
              chain: baseMainnet,
            })
            .then((hash) => {
              return waitForTransactionReceipt(secretShopClient, {
                hash,
              })
            })
            .then((receipt) => {
              usdcTxHash = receipt.transactionHash
            })
            .catch((e) => {
              usdcTxHash = e.message
            })
        }
      }

      // send
      let sendTxHash: string | null = null
      const send = BigInt(15e5 * 1e16) // 150K SENDV0 * 1e16 = 1.5k SEND V1
      if (sendBal < send) {
        if (ssSendBal < send) {
          sendTxHash = 'Error: Insufficient SEND in secret shop'
        } else {
          await sendToken.write
            // only transfer the difference
            .transfer([address, send - sendBal], {
              chain: baseMainnet,
            })
            .then((hash) => {
              return waitForTransactionReceipt(secretShopClient, {
                hash,
              })
            })
            .then((receipt) => {
              sendTxHash = receipt.transactionHash
            })
            .catch((e) => {
              sendTxHash = e.message
            })
        }
      }

      // sendV0
      let sendV0TxHash: string | null = null
      const sendV0 = BigInt(15e5) // 150K SENDV0
      if (sendV0Bal < sendV0) {
        if (ssSendV0Bal < sendV0) {
          sendV0TxHash = 'Error: Insufficient SENDV0 in secret shop'
        } else {
          await sendV0Token.write
            // only transfer the difference
            .transfer([address, sendV0 - sendV0Bal], {
              chain: baseMainnet,
            })
            .then((hash) => {
              return waitForTransactionReceipt(secretShopClient, {
                hash,
              })
            })
            .then((receipt) => {
              sendV0TxHash = receipt.transactionHash
            })
            .catch((e) => {
              sendV0TxHash = e.message
            })
        }
      }

      return {
        ethTxHash,
        usdcTxHash,
        sendTxHash,
        sendV0TxHash,
      }
    }),
})
