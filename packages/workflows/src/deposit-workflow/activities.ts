import { baseMainnetClient, sendEarnUsdcFactoryAbi } from '@my/wagmi'
import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { Context as ActivityContext, ApplicationFailure, log, sleep } from '@temporalio/activity'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit,
  isVaultDeposit,
  type SendEarnDepositCall,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import type { UserOperation } from 'permissionless'
import { isAddressEqual, zeroAddress, type Address } from 'viem'
import { createUserOpActivities, type UserOpActivities } from '../userop-workflow/activities'
import { simulateUserOperation } from '../utils/userop'
import {
  getUserIdFromAddress,
  updateTemporalSendEarnDeposit,
  upsertTemporalSendEarnDeposit,
  type TemporalDeposit,
  type TemporalDepositInsert,
  type TemporalDepositUpdate,
} from './supabase'

type UpsertTemporalDepositActivityParams = {
  workflow_id: string
  status: TemporalDepositInsert['status']
  deposit: SendEarnDepositCall
  block_num: bigint
}

type DepositActivities = UserOpActivities & {
  upsertTemporalDepositActivity: (
    params: UpsertTemporalDepositActivityParams
  ) => Promise<TemporalDeposit>
  decodeDepositUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<SendEarnDepositCall>
  updateTemporalDepositActivity: (params: TemporalDepositUpdate) => Promise<TemporalDeposit>
  verifyDepositIndexedActivity: (params: {
    transactionHash: `0x${string}`
    owner: Address
  }) => Promise<boolean>
  upsertReferralRelationshipActivity: (params: {
    // Checks internally if referral needed
    deposit: SendEarnDepositCall
    transactionHash: `0x${string}`
  }) => Promise<void>
}

export const createDepositActivities = (
  env: Record<string, string | undefined>
): DepositActivities => {
  bootstrap(env)
  return {
    upsertTemporalDepositActivity,
    decodeDepositUserOpActivity,
    updateTemporalDepositActivity,
    verifyDepositIndexedActivity,
    upsertReferralRelationshipActivity,
    ...createUserOpActivities(env),
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

/**
 * Attempts to create a referral relationship based on a factory deposit event.
 * This activity now contains the logic to check if the deposit was a factory
 * deposit with a non-zero referrer address.
 * It validates the referral against the `send_earn_new_affiliate` table,
 * fetches user UUIDs, and inserts the relationship into the `referrals` table.
 * Logs warnings and does not throw errors for non-critical issues like
 * missing UUIDs or duplicate relationships to allow the main workflow to continue.
 */
async function upsertReferralRelationshipActivity({
  deposit, // The decoded deposit call object
  transactionHash,
}: {
  deposit: SendEarnDepositCall
  transactionHash: `0x${string}`
}): Promise<void> {
  // Check if it's a factory deposit with a non-zero referrer inside the activity
  if (!isFactoryDeposit(deposit) || isAddressEqual(deposit.referrer, zeroAddress)) {
    log.info('Skipping referral upsert: Not a factory deposit or no referrer', {
      depositType: deposit.type,
      referrer: isFactoryDeposit(deposit) ? deposit.referrer : undefined,
      transactionHash,
    })
    return // Exit early if conditions aren't met
  }

  // Conditions met, proceed with upsert
  const referrerAddress = deposit.referrer
  const referredAddress = deposit.owner // The owner of the deposit is the referred user

  log.info('Attempting to upsert referral relationship for factory deposit', {
    referrerAddress,
    referredAddress,
    transactionHash,
  })

  const referrerBytea = hexToBytea(referrerAddress)

  try {
    // 1. Validate against send_earn_new_affiliate
    // Use head: true and count: 'exact' to efficiently check existence without fetching data
    const validationResult = await supabaseAdmin
      .from('send_earn_new_affiliate')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate', referrerBytea)

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

/**
 * Upserts the initial temporal deposit record.
 * Extracts owner, assets, and potentially vault from the decoded deposit call.
 */
async function upsertTemporalDepositActivity({
  workflow_id: workflowId,
  status,
  deposit,
  block_num,
}: UpsertTemporalDepositActivityParams): Promise<TemporalDeposit> {
  log.info('Upserting initial deposit record', {
    owner: deposit.owner,
    block_num: block_num.toString(),
    status,
  })

  // Extract necessary fields from the deposit object
  const ownerBytea = hexToBytea(deposit.owner)
  // Vault only exists on VaultDeposit type
  const vaultBytea = hexToBytea(
    isVaultDeposit(deposit)
      ? deposit.vault
      : // HACK: lookup the default vault for the factory. THIS MAY NOT BE THE ACTUAL VAULT FOR THE DEPOSIT IF IT IS A REFERRAL
        await baseMainnetClient.readContract({
          address: deposit.factory,
          abi: sendEarnUsdcFactoryAbi,
          functionName: 'VAULT',
        })
  )

  const { data: upsertData, error } = await upsertTemporalSendEarnDeposit({
    workflow_id: workflowId,
    status: status,
    owner: ownerBytea,
    assets: deposit.assets.toString(),
    vault: vaultBytea,
    block_num: Number(block_num),
  })

  if (error) {
    log.error('upsertTemporalDepositActivity failed', { error })
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
  log.info('Initial deposit record upserted')
  return upsertData
}

async function decodeDepositUserOpActivity(
  workflowId: string,
  userOp: UserOperation<'v0.7'>
): Promise<SendEarnDepositCall> {
  log.info('Decoding deposit UserOperation')
  try {
    const decoded = decodeSendEarnDepositUserOp({ userOp })
    return decoded
  } catch (error) {
    log.error('decodeDepositUserOpActivity failed', { error })
    const { error: updateError } = await updateTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message ?? 'Failed to decode UserOperation',
    })
    if (updateError) {
      log.error('Failed to update deposit status after decode failure', {
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
    log.error('updateTemporalDepositActivity failed', { status, error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable(
        'Database connection error, retrying update...',
        error.code,
        { error, status }
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
          updateFailedError,
        })
      }
    }
    throw ApplicationFailure.nonRetryable(
      `Database error occurred during update to status ${status}`,
      error.code,
      { error, status }
    )
  }
  log.info('Temporal deposit record updated successfully', {
    status: updatedData.status,
  })
  return updatedData
}
