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

export default mockSendAccounts
