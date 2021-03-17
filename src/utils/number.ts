export function inRange(min: number, value: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

// https://stackoverflow.com/q/4467539/1118709
export function modulo(dividend: number, divider: number): number {
  return ((dividend % divider) + divider) % divider
}

export const roundWithBase = makeAlignWithBase(Math.round)
export const floorWithBase = makeAlignWithBase(Math.floor)
export const ceilWithBase = makeAlignWithBase(Math.ceil)

function makeAlignWithBase(aligner: (number: number) => number): (number: number, base: number) => number {
  return (number, base) => {
    if (base < 1 && base > -1) {
      // JavaScript tends to lose precision when a number is divided by a very small number.
      // It's safer to turn it into a big number and do the opposite operation.
      const oppositeBase = 1 / base
      return aligner(number * oppositeBase) / oppositeBase
    } else {
      return aligner(number / base) * base
    }
  }
}

const shortNumberSuffixes = ['K', 'M', 'B']

export function formatNumberToShortForm(number: number): string {
  const suffixPower = getNumberSuffixPower(number)
  return suffixPower === 0 ? String(number) : number / 1000 ** suffixPower + shortNumberSuffixes[suffixPower - 1]
}

function getNumberSuffixPower(number: number): number {
  if (number === 0) {
    return 0
  }

  for (let power = 1; power <= shortNumberSuffixes.length; ++power) {
    const base = 1000 ** power

    if (number % base !== 0) {
      return power - 1
    }
  }

  return shortNumberSuffixes.length
}

export function formatNumberWithThousandGroups(number: number, divider = ' '): string {
  const [integer, fractional] = String(number).split('.')
  const digitsCount = integer.length
  let groupedInteger = ''

  for (let i = 0; i < digitsCount; i += 3) {
    groupedInteger =
      integer.slice(Math.max(0, digitsCount - i - 3), digitsCount - i) +
      (groupedInteger ? divider + groupedInteger : '')
  }

  return groupedInteger + (fractional ? `.${fractional}` : '')
}
