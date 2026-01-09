// Bank Transfer (Bridge XYZ) hooks and utilities
export {
  useBridgeCustomer,
  useInitiateKyc,
  useKycStatus,
  useSyncKycStatus,
  BRIDGE_CUSTOMER_QUERY_KEY,
} from './useBridgeCustomer'

export {
  useBridgeVirtualAccount,
  useCreateVirtualAccount,
  useBankAccountDetails,
  BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY,
} from './useBridgeVirtualAccount'

export {
  useBridgeTransferTemplate,
  useCreateTransferTemplate,
  useTransferTemplateBankAccountDetails,
  BRIDGE_TRANSFER_TEMPLATE_QUERY_KEY,
} from './useBridgeTransferTemplate'

export { useBridgeGeoBlock } from './useBridgeGeoBlock'

export {
  useBridgeDeposits,
  useBridgeDeposit,
  useDepositsSummary,
  BRIDGE_DEPOSITS_QUERY_KEY,
} from './useBridgeDeposits'
