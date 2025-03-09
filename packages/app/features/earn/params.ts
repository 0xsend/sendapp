import { createParam } from 'solito'

const { useParam } = createParam()

export const useAsset = () => {
  const [asset] = useParam('asset')
  return asset
}
