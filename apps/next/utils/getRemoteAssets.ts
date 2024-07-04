import { getPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export async function getRemoteAssets(paths: string[] = []) {
  const remoteImageUrl = 'https://ghassets.send.app/'
  const imagePromises = paths.map((path) => getPlaiceholderImage(remoteImageUrl + path))
  return await Promise.all(imagePromises)
}
