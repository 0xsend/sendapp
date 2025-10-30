import React from 'react'

// Web version using simple objects instead of SharedValue
type SharedValueWeb<T> = { value: T }

export const CurveType = {
  basis: 'basis',
  bump: 'bump',
  linear: 'linear',
  monotone: 'monotone',
  natural: 'natural',
  step: 'step',
} as const

export type Point = {
  x: number
  y: number
}

export type DataType = {
  yRange?: [number, number]
  points: Point[]
  nativePoints?: Point[]
  curve?: keyof typeof CurveType
}

export type CallbackType = {
  data: DataType
  width: number
  height: number
  yRange?: [number, number]
}

export type PathData = {
  path: string
  parsed: null
  points: (Point & { originalY: number; originalX: number })[]
  data: Point[]
  smallestX?: Point
  smallestY?: Point
  greatestX?: Point
  greatestY?: Point
}

export type PathScales = {
  scaleX: (value: number) => number
  scaleY: (value: number) => number
}

type WithPathData = Pick<PathData, 'smallestX' | 'smallestY' | 'greatestX' | 'greatestY'>

export type ChartData = {
  data: DataType
  width: number
  height: number
  progress: SharedValueWeb<number>
  dotScale: SharedValueWeb<number>
  originalX: SharedValueWeb<string>
  originalY: SharedValueWeb<string>
  state: SharedValueWeb<number>
  isActive: SharedValueWeb<boolean>
  positionX: SharedValueWeb<number>
  positionY: SharedValueWeb<number>
  previousPath: PathData | null
  currentPath: PathData | null
  stroke: string
  selectedStroke: string
  color: string
} & WithPathData

export const ChartContext = React.createContext<ChartData | null>(null)
