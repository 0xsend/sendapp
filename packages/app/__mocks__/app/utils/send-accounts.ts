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
}

export const useSendAccounts = mockSendAccounts.useSendAccounts

export default mockSendAccounts
