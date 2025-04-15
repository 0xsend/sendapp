import { jest } from '@jest/globals'

export const createParam = jest.fn(() => {
  return {
    useParam: jest.fn(),
    useParams: jest.fn(),
  }
})
export default {
  createParam,
}
