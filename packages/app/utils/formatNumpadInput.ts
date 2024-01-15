export default function formatNumpadInput(value: string, input: string, maxValue?: number) {
  let newValue
  if (input === '.') {
    newValue = value.includes('.') ? value : `${value}.`
  } else if (input === '<') {
    newValue = value.length === 1 ? '0' : value.slice(0, -1)
  } else if (value === '0') {
    newValue = input
  } else {
    newValue = value + input
  }

  if (maxValue !== undefined && Number(newValue) >= maxValue) {
    return maxValue.toString()
  }

  return newValue
}
