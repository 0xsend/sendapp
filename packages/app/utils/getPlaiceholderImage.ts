import { getPlaiceholder, GetPlaiceholderOptions, GetPlaiceholderReturn } from 'plaiceholder'
type img = { src: string; height: number; width: number }

export type GetPlaiceholderImage = { img: img } & Omit<GetPlaiceholderReturn, 'metadata'>

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
