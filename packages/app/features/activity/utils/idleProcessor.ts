export interface ProcessorOptions {
  /** Minimum time remaining (ms) to process another item. Default: 1 */
  minTimeRemaining?: number
  /** Timeout (ms) to force processing even if not idle. Default: 100 */
  timeout?: number
}

/**
 * Process items in chunks during idle time.
 * Returns a cancel function to abort processing.
 */
export function processInChunks<T, R>(
  items: T[],
  transform: (item: T, index: number) => R,
  onComplete: (results: R[]) => void,
  options: ProcessorOptions = {}
): () => void {
  const { minTimeRemaining = 1, timeout = 100 } = options

  let index = 0
  let handle: number | null = null
  let cancelled = false
  const results: R[] = []

  function processChunk(deadline: IdleDeadline) {
    if (cancelled) return

    // Process items while we have time
    while (
      index < items.length &&
      items[index] &&
      (deadline.timeRemaining() > minTimeRemaining || deadline.didTimeout)
    ) {
      const item = items[index]
      if (item) {
        results.push(transform(item, index))
      }
      index++
    }

    if (index < items.length && !cancelled) {
      // More items to process - schedule next chunk
      handle = requestIdleCallback(processChunk, { timeout })
    } else if (!cancelled) {
      // All done
      onComplete(results)
    }
  }

  // Start processing
  handle = requestIdleCallback(processChunk, { timeout })

  // Return cancel function
  return () => {
    cancelled = true
    if (handle !== null) {
      cancelIdleCallback(handle)
    }
  }
}
