import { useRef } from 'react'
import { d3Interpolate } from './d3Interpolate'

// Web version - no worklets needed
const moduleCache: Record<string, unknown> = {}

function requireOrAdd(name: string, module: () => unknown) {
  if (!moduleCache[name]) {
    moduleCache[name] = module()
  }
  return moduleCache[name]
}

export function requireOnWorklet(name: 'd3-interpolate-path') {
  switch (name) {
    case 'd3-interpolate-path':
      return requireOrAdd(name, d3Interpolate)
    default:
      throw new Error(`Cannot resolve UI module with a name ${name}`)
  }
}

let _id = Number.MIN_SAFE_INTEGER
const remoteValues: Record<string, unknown> = {}

export function useWorkletValue() {
  const idRef = useRef<string>()

  if (!idRef.current) {
    idRef.current = `workletValue_${_id++}`
  }

  const { current } = idRef

  // Return a function that returns a simple getter/setter object
  return () => ({
    get value() {
      return remoteValues[current]
    },
    set value(value: unknown) {
      remoteValues[current] = value
    },
  })
}
