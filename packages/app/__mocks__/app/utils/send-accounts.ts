const mockSendAccounts = {
  useSendAccounts: jest.fn().mockReturnValue({
    data: [
      {
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
