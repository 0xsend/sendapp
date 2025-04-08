import type { PgBytea } from '@my/supabase/database.types'
import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { Context as ActivityContext, ApplicationFailure, log, sleep } from '@temporalio/activity'
import { byteaToHex } from 'app/utils/byteaToHex'
import {
  decodeSendEarnDepositUserOp,
  type SendEarnDepositCall,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import type { Address } from 'viem'
import {
  sendUserOperation,
  simulateUserOperation,
  waitForUserOperationReceipt,
} from '../utils/userop'
import {
  getUserIdFromAddress,
  updateTemporalSendEarnDeposit,
  upsertTemporalSendEarnDeposit,
  type TemporalDeposit,
  type TemporalDepositInsert,
  type TemporalDepositUpdate,
} from './supabase'

type DepositActivities = {
  upsertTemporalDepositActivity: (params: TemporalDepositInsert) => Promise<TemporalDeposit>
  simulateDepositActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<void>
  decodeDepositUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<SendEarnDepositCall>
  updateTemporalDepositActivity: (params: TemporalDepositUpdate) => Promise<TemporalDeposit>
  sendUserOpActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<PgBytea> // Returns userOpHash as PgBytea
  waitForTransactionReceiptActivity: (
    workflowId: string,
    userOpHash: PgBytea
  ) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
  }>
  verifyDepositIndexedActivity: (params: {
    transactionHash: `0x${string}`
    owner: Address
  }) => Promise<boolean>
  getVaultFromFactoryDepositActivity: ({
    userOp,
    txHash,
  }: { userOp: UserOperation<'v0.7'>; txHash: `0x${string}` }) => Promise<Address | null>
  upsertReferralRelationshipActivity: (params: {
    referrerAddress: Address
    referredAddress: Address
    transactionHash: `0x${string}`
  }) => Promise<void>
}

export const createDepositActivities = (
  env: Record<string, string | undefined>
): DepositActivities => {
  bootstrap(env)
  return {
    upsertTemporalDepositActivity,
    simulateDepositActivity,
    decodeDepositUserOpActivity,
    updateTemporalDepositActivity,
    sendUserOpActivity,
    waitForTransactionReceiptActivity,
    verifyDepositIndexedActivity, // Added verifyDepositIndexedActivity
    getVaultFromFactoryDepositActivity,
    upsertReferralRelationshipActivity,
  }
}

async function verifyDepositIndexedActivity({
  transactionHash,
  owner,
}: {
  transactionHash: `0x${string}`
  owner: Address
}): Promise<boolean> {
  const maxAttempts = 10 // Example: Retry up to 10 times
  const initialDelayMs = 1000 // Example: Start with 1 second delay
  const backoffCoefficient = 2 // Example: Double delay each time

  const txHashBytea = hexToBytea(transactionHash)
  const ownerBytea = hexToBytea(owner)

  log.info('Starting verification for indexed deposit', { transactionHash, owner })

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ActivityContext.current().heartbeat(`Attempt ${attempt}/${maxAttempts}`) // Send heartbeat

    try {
      const { error, count } = await supabaseAdmin
        .from('send_earn_deposit')
        .select('*', { count: 'exact', head: true }) // Efficiently check existence
        .eq('tx_hash', txHashBytea)
        .eq('owner', ownerBytea)

      if (error) {
        log.error('DB error checking send_earn_deposit', { transactionHash, owner, attempt, error })
        if (isRetryableDBError(error)) {
          // Let Temporal handle retry based on policy for retryable DB errors
          throw ApplicationFailure.retryable(
            `Retryable DB error on attempt ${attempt}`,
            error.code,
            { error }
          )
        }
        // Non-retryable DB error
        throw ApplicationFailure.nonRetryable(
          'Non-retryable DB error checking deposit index',
          error.code,
          { error }
        )
      }

      if (count !== null && count > 0) {
        log.info('Deposit successfully verified as indexed', { transactionHash, owner, attempt })
        return true // Found the record
      }

      // Record not found yet, log and prepare for next attempt
      log.info(`Deposit not yet indexed, attempt ${attempt}/${maxAttempts}`, {
        transactionHash,
        owner,
      })
    } catch (error) {
      // Catch ApplicationFailures rethrown from DB checks or unexpected errors
      log.error('Error during deposit verification attempt', {
        transactionHash,
        owner,
        attempt,
        error,
      })
      if (error instanceof ApplicationFailure) {
        throw error // Re-throw known Temporal failures
      }
      // Treat other unexpected errors as non-retryable for this attempt
      throw ApplicationFailure.nonRetryable(
        error.message ?? `Unexpected error during verification attempt ${attempt}`,
        'VERIFICATION_ATTEMPT_FAILED',
        { error }
      )
    }

    // If not the last attempt, wait before retrying
    if (attempt < maxAttempts) {
      const delay = initialDelayMs * backoffCoefficient ** (attempt - 1) // Use exponentiation operator
      log.info(`Waiting ${delay}ms before next verification attempt`, { transactionHash, owner })
      await sleep(delay) // Use Temporal's sleep for cancellation awareness
    }
  }

  // If loop completes without finding the record
  log.error('Deposit indexing verification timed out after max attempts', {
    transactionHash,
    owner,
    maxAttempts,
  })
  throw ApplicationFailure.nonRetryable(
    'Deposit indexing verification failed after maximum attempts',
    'VERIFICATION_TIMEOUT',
    { transactionHash, owner, maxAttempts }
  )
}

async function getVaultFromFactoryDepositActivity({
  userOp,
  txHash,
}: { userOp: UserOperation<'v0.7'>; txHash: `0x${string}` }): Promise<Address | null> {
  const txHashBytea = hexToBytea(txHash)
  log.info('Attempting to fetch vault address from send_earn_create', { transactionHash: txHash })

  try {
    // Query the send_earn_create table which logs the SendEarnCreated event
    const { data, error } = await supabaseAdmin
      .from('send_earn_create')
      .select('vault')
      .eq('tx_hash', txHashBytea)
      .eq('caller', hexToBytea(userOp.sender))
      .maybeSingle()

    if (error) {
      log.error('DB error fetching vault from send_earn_create', { transactionHash: txHash, error })
      if (isRetryableDBError(error)) {
        throw ApplicationFailure.retryable('Database connection error fetching vault', error.code, {
          error,
          transactionHash: txHash,
        })
      }
      throw ApplicationFailure.nonRetryable(
        'Non-retryable DB error fetching vault from send_earn_create',
        error.code,
        {
          error,
          transactionHash: txHash,
        }
      )
    }

    if (!data || !data.vault) {
      log.warn('Vault address not found in send_earn_create for tx', { transactionHash: txHash })
      return null
    }

    const vaultAddress = byteaToHex(data.vault as `\\x${string}`)
    log.info('Successfully fetched vault address', { transactionHash: txHash, vaultAddress })
    return vaultAddress
  } catch (error) {
    // Catch potential ApplicationFailures rethrown from DB checks or unexpected errors
    log.error('Unexpected error in getVaultFromFactoryDepositActivity', {
      transactionHash: txHash,
      error,
    })
    if (error instanceof ApplicationFailure) {
      throw error // Re-throw known Temporal failures
    }
    // Treat other errors as non-retryable
    throw ApplicationFailure.nonRetryable(
      error.message ?? 'Unexpected error fetching vault address',
      'VAULT_FETCH_FAILED',
      { error, transactionHash: txHash }
    )
  }
}

async function upsertReferralRelationshipActivity({
  referrerAddress,
  referredAddress,
  transactionHash,
}: {
  referrerAddress: Address
  referredAddress: Address
  transactionHash: `0x${string}`
}): Promise<void> {
  log.info('Attempting to upsert referral relationship', {
    referrerAddress,
    referredAddress,
    transactionHash,
  })
  const referrerBytea = hexToBytea(referrerAddress)
  const referredBytea = hexToBytea(referredAddress)
  const txHashBytea = hexToBytea(transactionHash)

  try {
    // 1. Validate against send_earn_new_affiliate
    // Use head: true and count: 'exact' to efficiently check existence without fetching data
    const validationResult = await supabaseAdmin
      .from('send_earn_new_affiliate')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate', referrerBytea)
      .eq('send_earn_affiliate', referredBytea)
      .eq('tx_hash', txHashBytea)

    if (validationResult.error) {
      log.error('DB error validating referral in send_earn_new_affiliate', {
        referrerAddress,
        referredAddress,
        transactionHash,
        validationError: validationResult.error,
      })
      if (isRetryableDBError(validationResult.error)) {
        throw ApplicationFailure.retryable(
          'DB connection error validating referral',
          validationResult.error.code,
          { validationError: validationResult.error }
        )
      }
      throw ApplicationFailure.nonRetryable(
        'Non-retryable DB error validating referral',
        validationResult.error.code,
        { validationError: validationResult.error }
      )
    }

    // Access count directly from the result object when head: true is used
    if (validationResult.count !== 1) {
      log.warn('Referral validation failed: No matching record found in send_earn_new_affiliate', {
        referrerAddress,
        referredAddress,
        transactionHash,
        count: validationResult.count ?? 0,
      })
      // Not an error, just means this deposit didn't trigger a new affiliate event we track
      return
    }

    log.info('Referral validated against send_earn_new_affiliate', {
      referrerAddress,
      referredAddress,
      transactionHash,
    })

    // 2. Get User UUIDs
    const referrerUuid = await getUserIdFromAddress(referrerAddress)
    const referredUuid = await getUserIdFromAddress(referredAddress)

    if (!referrerUuid || !referredUuid) {
      log.warn('Could not find UUID for referrer or referred user, skipping referral insert', {
        referrerAddress,
        referredAddress,
        referrerUuidFound: !!referrerUuid,
        referredUuidFound: !!referredUuid,
      })
      // Not necessarily an error, users might not exist in send_accounts yet
      return
    }

    log.info('Found UUIDs for referrer and referred users', { referrerUuid, referredUuid })

    // 3. Insert into referrals table
    const { error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({ referrer_id: referrerUuid, referred_id: referredUuid })

    if (insertError) {
      // need to handle duplicates gracefully
      if (insertError.code === '23505') {
        log.info('Duplicate referral relationship', { referrerUuid, referredUuid })
        return
      }
      log.error('DB error inserting referral relationship', {
        referrerUuid,
        referredUuid,
        insertError,
      })
      if (isRetryableDBError(insertError)) {
        throw ApplicationFailure.retryable(
          'DB connection error inserting referral',
          insertError.code,
          { insertError }
        )
      }
      throw ApplicationFailure.nonRetryable(
        'Non-retryable DB error inserting referral',
        insertError.code,
        { insertError }
      )
    }

    log.info('Successfully inserted referral relationship', {
      referrerUuid,
      referredUuid,
    })
  } catch (error) {
    log.error('Unexpected error in upsertReferralRelationshipActivity', {
      referrerAddress,
      referredAddress,
      transactionHash,
      error,
    })
    if (error instanceof ApplicationFailure) {
      throw error // Re-throw known Temporal failures
    }
    // Treat other errors as non-retryable, but log as warning as workflow shouldn't fail here
    log.warn('Non-retryable error during referral upsert, continuing workflow', {
      error,
      referrerAddress,
      referredAddress,
    })
    // Do not throw ApplicationFailure here to allow workflow to continue
  }
}

async function sendUserOpActivity(
  workflowId: string,
  userOp: UserOperation<'v0.7'>
): Promise<PgBytea> {
  try {
    const hash = await sendUserOperation(userOp)
    const hashBytea = hexToBytea(hash)
    return hashBytea
  } catch (error) {
    log.error('sendUserOpActivity failed', { workflowId, error })
    const { error: updateError } = await updateTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message ?? 'Failed to send UserOperation',
    })
    if (updateError) {
      // Log the update error but prioritize throwing the original failure
      log.error('Failed to update deposit status after sendUserOp failure', {
        workflowId,
        updateError,
      })
    }
    // Throw non-retryable failure for the activity
    throw ApplicationFailure.nonRetryable(
      error.message ?? 'Error sending user operation',
      error.code ?? 'SEND_USER_OP_FAILED',
      error
    )
  }
}

async function waitForTransactionReceiptActivity(
  workflowId: string,
  userOpHash: PgBytea
): Promise<{ transactionHash: `0x${string}`; blockNumber: bigint }> {
  const hexHash = byteaToHex(userOpHash)
  try {
    const bundlerReceipt = await waitForUserOperationReceipt(hexHash)
    if (!bundlerReceipt) {
      throw ApplicationFailure.retryable(
        'No receipt returned from waitForTransactionReceipt',
        'NO_RECEIPT'
      )
    }
    log.info('waitForTransactionReceiptActivity received receipt', {
      workflowId,
      bundlerReceipt: superjson.stringify(bundlerReceipt),
    })
    if (!bundlerReceipt.success) {
      // Non-retryable failure if the transaction itself failed on-chain
      throw ApplicationFailure.nonRetryable('Transaction failed on-chain', 'TX_FAILED', {
        receipt: bundlerReceipt.receipt,
      })
    }
    if (!bundlerReceipt.receipt.transactionHash || !bundlerReceipt.receipt.blockNumber) {
      throw ApplicationFailure.nonRetryable(
        'Receipt missing transactionHash or blockNumber',
        'INVALID_RECEIPT',
        { receipt: bundlerReceipt.receipt }
      )
    }
    return {
      transactionHash: bundlerReceipt.receipt.transactionHash,
      blockNumber: bundlerReceipt.receipt.blockNumber,
    }
  } catch (error) {
    log.error('waitForTransactionReceiptActivity failed', { workflowId, hexHash, error })
    // Attempt to mark the workflow as failed in the DB
    const { error: updateError } = await updateTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message ?? 'Failed waiting for transaction receipt',
    })
    if (updateError) {
      log.error('Failed to update deposit status after waitForTransactionReceipt failure', {
        workflowId,
        updateError,
      })
    }

    // Re-throw original error (could be retryable or non-retryable based on the catch block)
    if (error instanceof ApplicationFailure) {
      throw error // Preserve original failure type
    }
    // Treat unexpected errors as non-retryable by default
    throw ApplicationFailure.nonRetryable(
      error.message ?? 'Error waiting for transaction receipt',
      error.code ?? 'WAIT_RECEIPT_FAILED',
      error
    )
  }
}

async function upsertTemporalDepositActivity({
  workflow_id: workflowId,
  owner,
  assets,
  vault,
}: TemporalDepositInsert): Promise<TemporalDeposit> {
  log.info('Upserting initial deposit record', {
    workflowId,
    owner: byteaToHex(owner as `\\x${string}`),
  })
  const { data: upsertData, error } = await upsertTemporalSendEarnDeposit({
    workflow_id: workflowId,
    status: 'initialized',
    owner,
    assets,
    vault,
  })

  if (error) {
    log.error('upsertTemporalDepositActivity failed', { workflowId, error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable(
        'Database connection error, retrying upsert...',
        error.code,
        { error, workflowId }
      )
    }
    // Don't try to update status to failed if the initial insert failed
    throw ApplicationFailure.nonRetryable(
      'Database error occurred during initial upsert',
      error.code,
      { error, workflowId }
    )
  }
  log.info('Initial deposit record upserted', { workflowId, id: upsertData.workflow_id }) // Corrected property access
  return upsertData
}

async function simulateDepositActivity(workflowId, userOp) {
  log.info('Simulating deposit UserOperation', { workflowId })
  try {
    await simulateUserOperation(userOp)
    log.info('Deposit UserOperation simulation successful', { workflowId })
  } catch (error) {
    log.error('simulateDepositActivity failed', { workflowId, error })
    const { error: updateError } = await updateTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message ?? 'Simulation failed',
    })
    if (updateError) {
      log.error('Failed to update deposit status after simulation failure', {
        workflowId,
        updateError,
      })
    }
    throw ApplicationFailure.nonRetryable(
      error.message ?? 'Error simulating user operation',
      error.code ?? 'SIMULATION_FAILED',
      error
    )
  }
}

async function decodeDepositUserOpActivity(
  workflowId: string,
  userOp: UserOperation<'v0.7'>
): Promise<SendEarnDepositCall> {
  log.info('Decoding deposit UserOperation', { workflowId })
  try {
    const decoded = decodeSendEarnDepositUserOp({ userOp })
    return decoded
  } catch (error) {
    log.error('decodeDepositUserOpActivity failed', { workflowId, error })
    const { error: updateError } = await updateTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message ?? 'Failed to decode UserOperation',
    })
    if (updateError) {
      log.error('Failed to update deposit status after decode failure', {
        workflowId,
        updateError,
      })
    }
    throw ApplicationFailure.nonRetryable(
      error.message ?? 'Error decoding user operation',
      error.code ?? 'DECODE_FAILED',
      error
    )
  }
}

async function updateTemporalDepositActivity({
  workflow_id: workflowId,
  status,
  assets,
  vault,
  user_op_hash: userOpHash,
  tx_hash: txHash,
}: TemporalDepositUpdate): Promise<TemporalDeposit> {
  log.info('Updating temporal deposit record', {
    workflowId,
    status,
    user_op_hash: userOpHash,
    tx_hash: txHash,
  })
  const updatePayload: TemporalDepositUpdate = {
    workflow_id: workflowId,
    status: status,
    ...(assets && { assets }),
    ...(vault && { vault }),
    ...(userOpHash && { user_op_hash: userOpHash }),
    ...(txHash && { tx_hash: txHash }),
  }

  const { data: updatedData, error } = await updateTemporalSendEarnDeposit(updatePayload)

  if (error) {
    log.error('updateTemporalDepositActivity failed', { workflowId, status, error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable(
        'Database connection error, retrying update...',
        error.code,
        { error, workflowId, status }
      )
    }
    // Avoid trying to update status to 'failed' if the update itself failed,
    // unless the current status isn't already 'failed'.
    if (status !== 'failed') {
      const { error: updateFailedError } = await updateTemporalSendEarnDeposit({
        workflow_id: workflowId,
        status: 'failed',
        error_message: `DB error during status update to ${status}: ${error.message}`,
      })
      if (updateFailedError) {
        log.error('Failed to update deposit status to failed after another update failure', {
          workflowId,
          updateFailedError,
        })
      }
    }
    throw ApplicationFailure.nonRetryable(
      `Database error occurred during update to status ${status}`,
      error.code,
      { error, workflowId, status }
    )
  }
  log.info('Temporal deposit record updated successfully', {
    workflowId,
    status: updatedData.status,
  })
  return updatedData
}
