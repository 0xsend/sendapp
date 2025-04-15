import { jest } from '@jest/globals'
export const usePathname = jest.fn()
export const useRoute = jest.fn()
export const useRouter = jest.fn()

export default {
  usePathname,
  useRoute,
  useRouter,
}
