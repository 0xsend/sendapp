const mockUseAddressBook = {
  data: {
    '0x1234567890123456789012345678901234567890': `0x${'1234'.repeat(40)}`,
    '0x0987654321098765432109876543210987654321': `0x${'0987'.repeat(40)}`,
    '0x1111111111111111111111111111111111111111': `0x${'1111'.repeat(40)}`,
  },
  isLoading: false,
  error: null,
}

export const useAddressBook = jest.fn().mockReturnValue(mockUseAddressBook)

export default {
  useAddressBook,
}
