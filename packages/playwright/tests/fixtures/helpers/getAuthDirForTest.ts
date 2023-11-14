import path from 'path'
import type { TestInfo } from '@playwright/test'
export const getAuthDirForTest = async (info: TestInfo) => {
  return path.join(info.project.outputDir, '.auth', info.parallelIndex.toString())
}
