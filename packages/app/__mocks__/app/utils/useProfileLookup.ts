const mockUseProfileLookup = jest.fn(() => ({
  isLoading: false,
  error: null,
  data: null,
}))

export const useProfileLookup = mockUseProfileLookup

export default {
  useProfileLookup,
}
