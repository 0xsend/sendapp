import { getPlaiceholder, GetPlaiceholderOptions } from 'plaiceholder'

export const getPlaiceholderImage = async (src: string, options?: GetPlaiceholderOptions) => {
  const buffer = await fetch(src).then(async (res) => Buffer.from(await res.arrayBuffer()))

  const {
    metadata: { height, width },
    ...plaiceholder
  } = await getPlaiceholder(buffer, options)

  return {
    ...plaiceholder,
    img: { src, height, width },
  }
}
