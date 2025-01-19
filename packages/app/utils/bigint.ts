export function min(...values: bigint[]) {
  return values.reduce((acc, curr) => (acc < curr ? acc : curr))
}

export function max(...values: bigint[]) {
  return values.reduce((acc, curr) => (acc > curr ? acc : curr))
}
