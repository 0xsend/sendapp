import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { RewardsScreen } from './screen'
import { render } from '@testing-library/react-native'

jest.mock('app/utils/useUser')
jest.mock('app/utils/distributions', () => ({
  useDistributions: () => ({
    data: [
      {
        number: 1,
        chain_id: 845337,
        qualification_end: Date.UTC(2024, 6, 15),
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
  usePrepareSendMerkleDropClaimTrancheWrite: jest.fn().mockReturnValue({
    data: {},
    isSuccess: true,
    error: null,
  }),
}))

jest.mock('app/utils/useChainAddresses', () => ({
  useChainAddresses: jest.fn().mockReturnValue({ data: { address: '0x123' } }),
}))
jest.mock('app/routers/params', () => ({
  useDistributionNumberParams: () => ({ distributionNumber: 1 }),
  useDistributionNumber: () => [1, jest.fn()],
}))
jest.mock('wagmi')
jest.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: jest.fn().mockReturnValue({ openConnectModal: jest.fn() }),
}))
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
jest.mock('app/utils/coin-gecko', () => ({
  useSendPrice: jest
    .fn()
    .mockReturnValue({ data: { 'send-token': { usd: 1 } }, isSuccess: true, error: null }),
}))
jest.mock('app/utils/tags', () => ({
  useConfirmedTags: jest.fn().mockReturnValue({ data: [{ name: 'tag1' }, { name: 'tag2' }] }),
}))
describe('EarnTokensScreen', () => {
  it('renders', () => {
    jest.useFakeTimers()
    jest.setSystemTime(Date.UTC(2024, 6, 12))
    const tree = render(
      <Wrapper>
        <RewardsScreen />
      </Wrapper>
    )

    expect(tree.toJSON()).toMatchSnapshot('EarnTokensScreen')
  })
})
