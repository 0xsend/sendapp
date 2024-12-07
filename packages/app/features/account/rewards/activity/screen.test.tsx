import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { ActivityRewardsScreen } from './screen'
import { act, render, screen } from '@testing-library/react-native'
import { DistributionProvider } from '../DistributionContext'

jest.mock('app/utils/distributions', () => ({
  useMonthlyDistributions: () => ({
    data: [
      {
        number: 7,
        chain_id: 845337,
        qualification_end: new Date(2024, 6, 30, 11, 59, 59),
        timezone_adjusted_qualification_end: new Date(2024, 6, 30, 11, 59, 59),
        distribution_shares: [
          {
            amount: 1,
            index: 1,
          },
        ],
        distribution_verifications_summary: [
          {
            tag_referrals: 123,
          },
        ],
        send_slash: [
          {
            minimum_sends: 1,
            scaling_divisor: 1,
          },
        ],
      },
    ],
  }),
  useDistributionVerifications: jest.fn().mockReturnValue({
    data: [
      {
        id: 1,
        type: 'create_passkey',
        weight: 1,
        fixed_value: 0,
        metadata: {},
      },
      {
        id: 2,
        type: 'tag_registration',
        weight: 1,
        fixed_value: 0,
        metadata: {},
      },
      {
        id: 3,
        type: 'send_ceiling',
        weight: 1,
        fixed_value: 0,
        metadata: { value: 0 },
      },
    ],
  }),
  useSendMerkleDropTrancheActive: jest.fn().mockReturnValue({
    data: true,
    isSuccess: true,
    error: null,
  }),
  useSendMerkleDropIsClaimed: jest.fn().mockReturnValue({
    data: true,
    isSuccess: true,
    error: null,
  }),
  useGenerateClaimUserOp: jest.fn().mockReturnValue({
    data: null,
  }),
  useUserOpClaimMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn().mockReturnValue(Promise.resolve()),
  }),
}))

jest.mock('app/utils/useUSDCFees', () => ({
  useUSDCFees: jest.fn().mockReturnValue({
    data: { baseFee: 100000, gasFees: 100000 },
    isSuccess: true,
    error: null,
  }),
}))

jest.mock('app/routers/params', () => ({
  useRewardsScreenParams: () => [{ distributionNumber: 1 }, jest.fn()],
}))

jest.mock('app/utils/useChainAddresses', () => ({
  useChainAddresses: jest.fn().mockReturnValue({ data: { address: '0x123' } }),
}))
jest.mock('wagmi')

jest.mock('@my/wagmi', () => ({
  __esModule: true,
  ...jest.requireActual('@my/wagmi'),
  baseMainnetClient: {
    chain: {
      id: 845337,
    },
    simulateContract: jest.fn().mockResolvedValue({}),
  },
  baseMainnetBundlerClient: {
    sendUserOperation: jest.fn(),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({ success: true }),
  },
  useReadSendTokenBalanceOf: jest.fn().mockReturnValue({
    data: 0n,
    isSuccess: true,
    error: null,
  }),
}))

jest.mock('app/utils/tags', () => ({
  useConfirmedTags: jest.fn().mockReturnValue({ data: [{ name: 'tag1' }, { name: 'tag2' }] }),
}))

jest.mock('app/utils/send-accounts', () => ({
  useSendAccount: jest.fn().mockReturnValue({
    data: {
      avatar_url: 'https://avatars.githubusercontent.com/u/123',
      name: 'test',
      about: 'test',
      refcode: 'test',
      tag: 'test',
      address: '0x123',
      phone: 'test',
      chain_id: 1,
      is_public: true,
      sendid: 1,
      all_tags: ['test'],
      send_account_credentials: [],
    },
  }),
}))

jest.mock('app/utils/useSendAccountBalances', () => ({
  useSendAccountBalances: jest.fn().mockReturnValue({
    balances: {
      USDC: 250000n,
      SEND: 250000n,
    },
    totalBalance: () => 5000000n,
  }),
}))

describe('ActivityRewardsScreen', () => {
  it('renders', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.UTC(2024, 7, 12))
    render(
      <DistributionProvider>
        <Wrapper>
          <ActivityRewardsScreen />
        </Wrapper>
      </DistributionProvider>
    )

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(screen.toJSON()).toMatchSnapshot('ActivityRewardsScreen')
  })
})
