import { parseAndProcessActivities, processActivity } from '../activity'
import { VirtualEvents, DatabaseEvents } from '../zod/activity'
import type { Activity } from '../zod/activity'
import type { AddressBook } from '../useAddressBook'
import { ContractLabels } from '../useAddressBook'

describe('Activity processing', () => {
  // Mock address book with Send Earn vault addresses
  const mockAddressBook: AddressBook = {
    '0x1234567890123456789012345678901234567890': ContractLabels.SendEarn,
    '0x0987654321098765432109876543210987654321': ContractLabels.SendEarn,
  }

  // Mock Send Account Transfer activity (withdraw to Send Earn vault)
  const mockSendEarnDepositActivity: Activity = {
    event_name: DatabaseEvents.SendAccountTransfers,
    created_at: new Date('2023-01-01T00:00:00Z'),
    from_user: {
      id: '123',
      name: null,
      avatar_url: null,
      send_id: 123,
      tags: [],
    },
    to_user: null, // Withdraw
    data: {
      f: '0x1111111111111111111111111111111111111111', // From user's wallet
      t: '0x1234567890123456789012345678901234567890', // To Send Earn vault
      v: BigInt(1000000000000000000), // 1 ETH
      log_addr: '0x2222222222222222222222222222222222222222',
      log_idx: BigInt(1),
      tx_idx: BigInt(1),
      tx_hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
      block_num: BigInt(1000000),
    },
  }

  // Mock Send Account Transfer activity (deposit from Send Earn vault)
  const mockSendEarnWithdrawActivity: Activity = {
    event_name: DatabaseEvents.SendAccountTransfers,
    created_at: new Date('2023-01-02T00:00:00Z'),
    from_user: null, // Deposit
    to_user: {
      id: '123',
      name: null,
      avatar_url: null,
      send_id: 123,
      tags: [],
    },
    data: {
      f: '0x0987654321098765432109876543210987654321', // From Send Earn vault
      t: '0x1111111111111111111111111111111111111111', // To user's wallet
      v: BigInt(1000000000000000000), // 1 ETH
      log_addr: '0x2222222222222222222222222222222222222222',
      log_idx: BigInt(2),
      tx_idx: BigInt(2),
      tx_hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
      block_num: BigInt(1000001),
    },
  }

  // Mock regular transfer activity
  const mockRegularTransferActivity: Activity = {
    event_name: DatabaseEvents.SendAccountTransfers,
    created_at: new Date('2023-01-03T00:00:00Z'),
    from_user: {
      id: '123',
      name: null,
      avatar_url: null,
      send_id: 123,
      tags: [],
    },
    to_user: {
      id: '456',
      name: null,
      avatar_url: null,
      send_id: 456,
      tags: [],
    },
    data: {
      f: '0x1111111111111111111111111111111111111111', // From user's wallet
      t: '0x5555555555555555555555555555555555555555', // To another user's wallet
      v: BigInt(1000000000000000000), // 1 ETH
      log_addr: '0x2222222222222222222222222222222222222222',
      log_idx: BigInt(3),
      tx_idx: BigInt(3),
      tx_hash: '0x6666666666666666666666666666666666666666666666666666666666666666',
      block_num: BigInt(1000002),
    },
  }

  describe('processActivity', () => {
    it('should identify Send Earn Deposit virtual events', () => {
      const result = processActivity(mockSendEarnDepositActivity, mockAddressBook)
      expect(result.event_name).toBe(VirtualEvents.SendEarnDeposit)
    })

    it('should identify Send Earn Withdraw virtual events', () => {
      const result = processActivity(mockSendEarnWithdrawActivity, mockAddressBook)
      expect(result.event_name).toBe(VirtualEvents.SendEarnWithdraw)
    })

    it('should not modify regular transfer events', () => {
      const result = processActivity(mockRegularTransferActivity, mockAddressBook)
      expect(result.event_name).toBe(DatabaseEvents.SendAccountTransfers)
    })
  })

  describe('parseAndProcessActivities', () => {
    it('should parse and process an array of activities', () => {
      const mockRawData = [
        mockSendEarnDepositActivity,
        mockSendEarnWithdrawActivity,
        mockRegularTransferActivity,
      ]

      const result = parseAndProcessActivities(mockRawData, { addressBook: mockAddressBook })

      expect(result).toHaveLength(3)
      expect(result[0]?.event_name).toBe(VirtualEvents.SendEarnDeposit)
      expect(result[1]?.event_name).toBe(VirtualEvents.SendEarnWithdraw)
      expect(result[2]?.event_name).toBe(DatabaseEvents.SendAccountTransfers)
    })

    it('should only parse without processing if no addressBook is provided', () => {
      const mockRawData = [
        mockSendEarnDepositActivity,
        mockSendEarnWithdrawActivity,
        mockRegularTransferActivity,
      ]

      const result = parseAndProcessActivities(mockRawData)

      expect(result).toHaveLength(3)
      expect(result[0]?.event_name).toBe(DatabaseEvents.SendAccountTransfers)
      expect(result[1]?.event_name).toBe(DatabaseEvents.SendAccountTransfers)
      expect(result[2]?.event_name).toBe(DatabaseEvents.SendAccountTransfers)
    })
  })
})
