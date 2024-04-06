import { getPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export async function getRemoteAssets(paths: string[] = []) {
  const remoteImageUrl = 'https://github.com/0xsend/assets/blob/main/'
  const imagePromises = paths.map((path) => getPlaiceholderImage(remoteImageUrl + path))
  return await Promise.all(imagePromises)
}
