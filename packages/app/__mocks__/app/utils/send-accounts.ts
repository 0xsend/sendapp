const mockSendAccounts = {
  useSendAccounts: jest.fn().mockReturnValue({
    data: [
      {
        address: `0xb0b${'0'.repeat(37)}`,
        webauthn_credentials: [
          {
            public_key: '\\x1234567890',
          },
        ],
      },
    ],
  }),
  useSendAccount: jest.fn().mockReturnValue({
    data: {
      address: `0xb0b${'0'.repeat(37)}`,
      webauthn_credentials: [
        {
          public_key: '\\x1234567890',
        },
      ],
    },
  }),
}

export const useSendAccounts = mockSendAccounts.useSendAccounts
export const useSendAccount = mockSendAccounts.useSendAccount
export default mockSendAccounts
