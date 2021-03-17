export function encodeFloat32ArrayBytes(array: Float32Array): string {
  let result = ''

  for (let i = 0; i < array.length; ++i) {
    result += array[i].toString(16).padStart(8, '0')
  }

  return result
}

export function decodeFloat32ArrayBytes(arrayBytesInHex: string): Float32Array {
  const buffer = new ArrayBuffer(arrayBytesInHex.length / 2)
  const intView = new Uint32Array(buffer)

  for (let i = 0; i < intView.length; ++i) {
    intView[i] = parseInt(arrayBytesInHex.slice(i * 8, i * 8 + 8), 16)
  }

  return new Float32Array(buffer)
}

export function getArrayMinAndMax(values: ArrayLike<number>): { min: number; max: number } {
  const result = {
    min: Infinity,
    max: -Infinity,
  }

  for (let i = 0; i < values.length; ++i) {
    if (values[i] < result.min) {
      result.min = values[i]
    }
    if (values[i] > result.max) {
      result.max = values[i]
    }
  }

  return result
}

export function fitRangeInRangeWhileKeepingLength(
  outerStart: number,
  outerEnd: number,
  innerStart: number,
  innerEnd: number,
): { start: number; end: number } {
  if (innerStart < outerStart) {
    innerEnd += outerStart - innerStart
    innerStart = outerStart
  }
  if (innerEnd > outerEnd) {
    innerStart = Math.max(outerStart, innerStart - (innerEnd - outerEnd))
    innerEnd = outerEnd
  }
  return { start: innerStart, end: innerEnd }
}

/**
 * Gets the minimum and the maximum value of chart line on the given range
 *
 * @param {number[]} values The line values
 * @param {number} from The range start index (can be float)
 * @param {number} to The range end index (can be float)
 * @return {{min: number, max: number}}
 */
export function getMinAndMaxOnRange(values: ArrayLike<number>, from: number, to: number): { min: number; max: number } {
  from = Math.max(0, from)
  to = Math.min(to, values.length - 1)

  // Check the left edge
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let min = interpolateLinear(values, from)!
  let max = min

  // Check the interim values
  for (let i = Math.ceil(from), e = Math.floor(to); i <= e; ++i) {
    if (values[i] < min) {
      min = values[i]
    } else if (values[i] > max) {
      max = values[i]
    }
  }

  // Check the right edge
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const value = interpolateLinear(values, to)!
  if (value < min) {
    min = value
  } else if (value > max) {
    max = value
  }

  return { min, max }
}

/**
 * Returns an interpolated value of the function
 *
 * @param values The function values (indices are Xs)
 * @param x The X value to interpolate
 */
export function interpolateLinear(values: ArrayLike<number>, x: number): number | undefined {
  if (x < 0 || x > values.length - 1) {
    return undefined
  }

  const x1 = Math.floor(x)
  const x2 = Math.ceil(x)

  return values[x1] + (values[x2] - values[x1]) * (x - x1)
}

/**
 * Adds an item to the array if it's not in the array and removes otherwise
 */
export function toggleArrayItem<T>(array: readonly T[], item: T): T[] {
  const index = array.indexOf(item)
  if (index === -1) {
    return [...array, item]
  } else {
    return [...array.slice(0, index), ...array.slice(index + 1)]
  }
}

export function countTruthy(values: unknown[]): number {
  return values.reduce<number>((sum, value) => sum + (value ? 1 : 0), 0)
}
