export const removeEmpty = <T extends Record<string, unknown>>(
  obj: T
): Partial<{ [K in keyof T]: Exclude<T[K], null | undefined> }> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null && v !== undefined)
  ) as Partial<{ [K in keyof T]: Exclude<T[K], null | undefined> }>
}
