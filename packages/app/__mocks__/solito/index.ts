export const createParam = jest.fn().mockReturnValue({
  useParam: jest.fn(),
  useParams: jest.fn(),
  setParams: jest.fn(),
})
export const useParam = jest.fn()
export const useParams = jest.fn()

export default {
  createParam,
  useParam,
  useParams,
}
