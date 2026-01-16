import { useMedia, type ViewProps } from '@tamagui/core'
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface AnimatedLetterTextProps extends ViewProps {
  children: string
}

const transition = {
  layout: { type: 'spring', stiffness: 1400, damping: 140 },
} as const

const letterStyle = {
  fontSize: 23,
  fontWeight: 500,
  color: 'var(--color12)',
  fontFamily: 'var(--f-family)',
}

const initial = {
  opacity: 0,
  scale: 0.6,
  filter: 'blur(2px)',
} as const
const animate = {
  opacity: 1,
  scale: 1,
  filter: 'blur(0px)',
} as const
const exit = initial

// light version for low end devices
const initialNoBlur = {
  opacity: 0,
  scale: 0.6,
} as const
const animateNoBlur = {
  opacity: 1,
  scale: 1,
} as const
const exitNoBlur = initialNoBlur

function createEachLetter(letter: string, text: string, index: number, isLowEndDevice: boolean) {
  const lowerLetter = letter.toLowerCase()
  const lowerText = text.toLowerCase()
  const howManySameLettersBefore = lowerText.slice(0, index).split(lowerLetter).length - 1

  return (
    <motion.span
      className="font_heading"
      key={`${lowerLetter}-${howManySameLettersBefore}`}
      layoutId={`${lowerLetter}-${howManySameLettersBefore}`}
      initial={isLowEndDevice ? initialNoBlur : initial}
      animate={isLowEndDevice ? animateNoBlur : animate}
      exit={isLowEndDevice ? exitNoBlur : exit}
      transition={transition}
      style={letterStyle}
    >
      {letter}
    </motion.span>
  )
}

export function AnimatedLetterText({ children }: AnimatedLetterTextProps) {
  const { sm } = useMedia()
  const letterItems = useMemo(() => {
    return children.split('').map((letter, index) => createEachLetter(letter, children, index, sm))
  }, [children, sm])

  return (
    <div style={{ display: 'inline-flex' }}>
      <AnimatePresence initial={false} mode="popLayout">
        {letterItems}
      </AnimatePresence>
    </div>
  )
}
