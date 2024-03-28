import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'
import { type BrowserContext, chromium } from '@playwright/test'
import debug from 'debug'
import extract from 'extract-zip'
import { access } from 'node:fs/promises'
import { finished } from 'node:stream/promises'
import { MetaMaskPage } from './page'

const log = debug('test:fixtures:metamask:install')

// Customise the version of MetaMask to use. Defaults to the latest version.
export const METAMASK_VERSION = process.env.METAMASK_VERISON

const baseDirectory = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'node_modules',
  '.cache',
  'metamask-extensions'
)

async function fetchMetamaskVersion(): Promise<string> {
  log('fetching metamask version')
  const response = await fetch(
    'https://api.github.com/repos/MetaMask/metamask-extension/releases/latest'
  )

  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
  if (response.body === null) throw new Error('response body is null')

  const json = await response.json()
  log('fetched metamask version', json.tag_name)
  return json.tag_name
}

const getExtensionPath = () => path.join(baseDirectory, 'metamask')

async function downloadAndExtractMetamask(version: string) {
  // Define the URL for the latest MetaMask extension release on GitHub
  const metamaskURL = `https://github.com/MetaMask/metamask-extension/releases/download/${version}/metamask-chrome-${version.replace(
    'v',
    ''
  )}.zip`
  const pathToExtension = getExtensionPath()
  const zipPath = `${pathToExtension}.zip`

  log('downloading and extracting metamask version to path', metamaskURL, pathToExtension)

  // Download the ZIP file using Fetch API
  const response = await fetch(metamaskURL)

  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
  if (response.body === null) throw new Error('response body is null')

  // ensure the directory exists
  await fs.promises.mkdir(path.dirname(zipPath), { recursive: true })

  // Save the ZIP file
  const fileStream = fs.createWriteStream(zipPath)
  // @ts-expect-error since fetch types are still unstable
  await finished(Readable.fromWeb(response.body).pipe(fileStream))

  // Extract the ZIP file
  await extract(zipPath, { dir: pathToExtension })

  // Delete the ZIP file
  fs.unlinkSync(zipPath)

  log('downloaded and extracted metamask version', version)

  return pathToExtension
}

async function getPathToMetamaskExtension() {
  const pathToExtension = getExtensionPath()

  return await access(pathToExtension)
    .then(() => pathToExtension)
    .catch(async () => {
      const version = METAMASK_VERSION ?? (await fetchMetamaskVersion())
      return await downloadAndExtractMetamask(version)
    })
}

/**
 * Launches a Chromium browser with MetaMask installed. Runs in headless mode by default. If the `HEADFULL` environment variable is set, runs in headful mode. Downloads and extracts the MetaMask extension if it is not already present.
 *
 * @param userDataDir The directory to use for the Chromium user data directory. If empty, a temporary directory will be used.
 * @returns A Promise resolving to the browser context.
 */
export async function launchChromiumWithMetamask(userDataDir = ''): Promise<BrowserContext> {
  // Check if the extension folder exists; if not, download and extract MetaMask
  const pathToExtension = await getPathToMetamaskExtension()

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      !process.env.HEADFULL ? '--headless=new' : '',
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ].filter(Boolean),
  })
  // extension is after the blank ghost page
  // see issue https://github.com/microsoft/playwright-python/issues/689
  if (context.pages().length < 2) await context.waitForEvent('page')
  // biome-ignore lint/style/noNonNullAssertion: we know there are at least 2 pages
  const extensionPage = context.pages()[1]!

  // setup metamask
  const metaMaskPage = new MetaMaskPage(extensionPage)
  await metaMaskPage.setupWallet()
  await extensionPage.close()

  return context
}
