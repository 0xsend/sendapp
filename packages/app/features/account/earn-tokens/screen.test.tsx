import { Wrapper } from 'app/utils/__mocks__/Wrapper'
import { EarnTokensScreen } from './screen'
import { render } from '@testing-library/react-native'

jest.mock('app/utils/useUser')
jest.mock('app/utils/distributions', () => ({
  useDistributions: () => ({
    data: [
      {
        number: 1,
        chain_id: 845337,
        qualification_end: new Date(),
        distribution_shares: [
          {
            amount: 1,
            index: 1,
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
jest.mock('app/utils/useUserReferralsCount', () => ({
  useUserReferralsCount: jest.fn().mockReturnValue({ referralsCount: 123, error: null }),
}))
jest.mock('app/utils/useChainAddresses', () => ({
  useChainAddresses: jest.fn().mockReturnValue({ data: { address: '0x123' } }),
}))
jest.mock('app/routers/params', () => ({
  useDistributionNumberParams: () => ({ distributionNumber: 1 }),
  useDistributionNumber: () => [1, jest.fn()],
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
describe('EarnTokensScreen', () => {
  it('renders', () => {
    const tree = render(
      <Wrapper>
        <EarnTokensScreen />
      </Wrapper>
    )

    expect(tree.toJSON()).toMatchSnapshot('EarnTokensScreen')
  })
})
