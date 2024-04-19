import { createParam } from 'solito'

export type Nav = { nav?: 'home' | 'settings' }

const { useParam: useNavParam } = createParam<Nav>()

export const useNav = () => {
  const [nav, setNavParam] = useNavParam('nav')

  return [nav, setNavParam] as const
}

export const useNavParams = () => {
  const [nav] = useNavParam('nav')

  return {
    nav,
  }
}

type Distribution = { distribution: number }

const { useParam: useDistributionNumberParam } = createParam<Distribution>()

export const useDistributionNumber = () => {
  const [distributionNumber, setDistributionNumberParam] = useDistributionNumberParam(
    'distribution',
    {
      initial: undefined,
      parse: (value) => Number(value),
    }
  )

  return [distributionNumber, setDistributionNumberParam] as const
}

export const useDistributionNumberParams = () => {
  const [distributionNumber] = useDistributionNumberParam('distribution', {
    initial: undefined,
    parse: (value) => Number(value),
  })
  return {
    distributionNumber,
  }
}
