import { createParam } from 'solito'

export type Params = {
  nav?: "home" | undefined
}

export const { useParam, useParams } = createParam<Params>()