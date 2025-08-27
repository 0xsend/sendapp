// @ts-nocheck
import { useRef } from 'react'
import { useWorkletCallback } from 'react-native-reanimated'
import { d3Interpolate } from './d3Interpolate'

// cache for worklet modules
function requireOrAdd(name: string, module: () => unknown) {
  'worklet'

  if (!global.__reanimatedUIModulesMap) {
    // @ts-ignore
    global.__reanimatedUIModulesMap = {}
  }
  // @ts-ignore
  if (!global.__reanimatedUIModulesMap[name]) {
    // @ts-ignore
    global.__reanimatedUIModulesMap[name] = module()
  }

  // @ts-ignore
  return global.__reanimatedUIModulesMap[name]
}

export function requireOnWorklet(name: 'd3-interpolate-path') {
  'worklet'

  // can be codegened
  switch (name) {
    case 'd3-interpolate-path':
      return requireOrAdd(name, d3Interpolate)
    default:
      throw new Error(`Cannot resolve UI module with a name ${name}`)
  }
}

let _id = Number.MIN_SAFE_INTEGER

export function useWorkletValue() {
  const idRef = useRef<number>(undefined)

  if (!idRef.current) {
    // TODO: use some uuid here
    // @ts-ignore
    idRef.current = `workletValue_${_id++}`
  }

  const { current } = idRef

  return useWorkletCallback(() => {
    'worklet'

    // @ts-ignore
    if (!global.remoteValues) {
      // @ts-ignore
      global.remoteValues = {}
    }

    return {
      get value() {
        // @ts-ignore
        return global.remoteValues[current]
      },
      set value(value) {
        // @ts-ignore
        global.remoteValues[current] = value
      },
    }
  })
}
