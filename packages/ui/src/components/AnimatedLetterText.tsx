import { Text, XStack, View, type ViewProps } from 'tamagui'
import { useEffect, useLayoutEffect, useRef, useState, memo } from 'react'
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated'

type LetterItem = {
  id: string
  letter: string
  index: number
}

function createLetterItems(newText: string, oldItems: LetterItem[] = []): LetterItem[] {
  const newLetters = newText.split('')
  const oldLetters = oldItems.map((item) => item.letter)

  const oldMatched: boolean[] = new Array(oldLetters.length).fill(false)
  const result: LetterItem[] = []

  for (let i = 0; i < newLetters.length; i++) {
    const newLetter = newLetters[i]
    if (!newLetter) continue

    let matched = false
    for (let j = 0; j < oldLetters.length; j++) {
      const oldItem = oldItems[j]
      if (!oldItem) continue

      if (!oldMatched[j] && oldLetters[j] === newLetter) {
        result.push({
          id: oldItem.id,
          letter: newLetter,
          index: i,
        })
        oldMatched[j] = true
        matched = true
        break
      }
    }

    if (!matched) {
      result.push({
        id: `new-${Date.now()}-${Math.random()}`,
        letter: newLetter,
        index: i,
      })
    }
  }

  return result
}

const layoutTransition = LinearTransition.springify().damping(30).stiffness(200)
const enterAnimation = FadeIn.duration(200).springify().damping(25).stiffness(150)
const exitAnimation = FadeOut.duration(150)

const AnimatedTextChar = memo(({ item }: { item: LetterItem }) => {
  return (
    <Animated.View layout={layoutTransition} entering={enterAnimation} exiting={exitAnimation}>
      <Text fontSize="$8" fontWeight="600" color="$color12">
        {item.letter}
      </Text>
    </Animated.View>
  )
})

AnimatedTextChar.displayName = 'AnimatedTextChar'

interface AnimatedLetterTextProps extends ViewProps {
  children: string
}

export function AnimatedLetterText({ children, ...props }: AnimatedLetterTextProps) {
  const [letterItems, setLetterItems] = useState<LetterItem[]>([])
  const prevItemsRef = useRef<LetterItem[]>([])
  const prevTextRef = useRef<string>('')

  useLayoutEffect(() => {
    if (children === prevTextRef.current) {
      return
    }

    const newItems = createLetterItems(children, prevItemsRef.current)
    prevItemsRef.current = newItems
    prevTextRef.current = children
    setLetterItems(newItems)
  }, [children])

  useEffect(() => {
    if (letterItems.length === 0 && children) {
      const initial = createLetterItems(children, [])
      prevItemsRef.current = initial
      prevTextRef.current = children
      setLetterItems(initial)
    }
  }, [children, letterItems.length])

  return (
    <View {...props}>
      <XStack pos="absolute" overflow="hidden">
        {letterItems.map((item) => (
          <AnimatedTextChar key={item.id} item={item} />
        ))}
      </XStack>
    </View>
  )
}
