import { createParam } from 'solito'

type Nav = { nav?: "home" }

const { useParam: useNavParam } = createParam<Nav>()

export const useNav = () => {
  const [nav, setNavParam] = useNavParam('nav')

  return [
    nav,
    setNavParam
  ] as const
}

export const useNavParams = () => {
  const [nav] = useNavParam('nav')

  return {
    nav
  }
}