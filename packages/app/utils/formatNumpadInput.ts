export default function formatNumpadInput(value: string, input: string) {
  if (input === '.') {
    if (!value.includes('.')) {
      return value + '.'
    }
  } else if (input === '<') {
    if (value.length === 1) {
      return '0'
    }
    return value.slice(0, -1)
  } else if (value === '0') {
    return input
  } else if ((value.split('.')?.at(1)?.length ?? 0) < 3) {
    return value + input
  }

  return value
}
