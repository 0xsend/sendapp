import { getPlaiceholder, GetPlaiceholderOptions, GetPlaiceholderReturn } from 'plaiceholder'
type img = { src: string; height: number; width: number }

export type GetPlaiceholderImage = ({ img: img } & Omit<GetPlaiceholderReturn, 'metadata'>) | null

export const getPlaiceholderImage = async (src: string, options?: GetPlaiceholderOptions) => {
  const buffer = await fetch(src)
    .then(async (res) => (res.ok ? Buffer.from(await res.arrayBuffer()) : null))
    .catch((e) => {
      console.error('Error fetching image:', e)
      return null
    })

  if (!buffer) return null

  const {
    metadata: { height, width },
    ...plaiceholder
  } = await getPlaiceholder(buffer, options)

  return {
    ...plaiceholder,
    img: { src, height, width },
  }
}
