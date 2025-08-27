export function findYExtremes(data: { x: number; y: number }[]) {
  // Handle empty input defensively
  if (!data.length) {
    const fallback = { x: 0, y: 0 }
    return { greatestY: fallback, smallestY: fallback }
  }
  // assume caller provides non-empty data; choose first element as initial extreme
  const first = data[0] ?? { x: 0, y: 0 }
  let smallestY = first
  let greatestY = first
  for (const d of data) {
    if (d && d.y !== undefined && d.y < smallestY.y) {
      smallestY = d
    }

    if (d && d.y !== undefined && d.y > greatestY.y) {
      greatestY = d
    }
  }
  return {
    greatestY,
    smallestY,
  }
}

export function addExtremesIfNeeded(
  res: { x: number; y: number }[],
  data: { x: number; y: number }[],
  includeExtremes?: boolean,
  removePointsSurroundingExtremes?: boolean
) {
  if (includeExtremes) {
    const { greatestY, smallestY } = findYExtremes(data)

    const sortedExtremes = [greatestY, smallestY].sort((a, b) => (a.x < b.x ? -1 : 1))
    const ex1 = sortedExtremes[0] ?? greatestY
    const ex2 = sortedExtremes[1] ?? smallestY
    let added1 = false
    let added2 = false

    const newRes: { x: number; y: number }[] = []
    for (let i = 0; i < res.length; i++) {
      const d = res[i]
      if (!d) continue
      let justAdded1 = false
      let justAdded2 = false
      const lastX =
        newRes.length > 0
          ? (newRes[newRes.length - 1]?.x ?? Number.NEGATIVE_INFINITY)
          : Number.NEGATIVE_INFINITY
      if (!added1 && lastX <= ex1.x && ex1.x <= d.x) {
        justAdded1 = true
        added1 = true
        if (ex1.x !== d.x) {
          if (removePointsSurroundingExtremes) {
            newRes.pop()
          }
          newRes.push(ex1)
        }
      }
      const lastX2 =
        newRes.length > 0
          ? (newRes[newRes.length - 1]?.x ?? Number.NEGATIVE_INFINITY)
          : Number.NEGATIVE_INFINITY
      if (!added2 && lastX2 <= ex2.x && ex2.x <= d.x) {
        justAdded2 = true
        added2 = true
        if (ex2.x !== d.x) {
          if (!justAdded1 && removePointsSurroundingExtremes) {
            newRes.pop()
          }

          newRes.push(ex2)
        }
      }
      if (
        (!justAdded1 && !justAdded2) ||
        !removePointsSurroundingExtremes ||
        i === res.length - 1
      ) {
        newRes.push(d)
      }
    }
    if (!added1) {
      newRes.push(ex1)
    }
    if (!added2) {
      newRes.push(ex2)
    }
    return newRes
  }
  return res
}
