import { modulo, floorWithBase, ceilWithBase, roundWithBase } from './number'

const log10Of2 = Math.log10(2)
const log10Of5 = Math.log10(5)

export interface DecimalScaleState {
  min: number
  max: number
  /** @see getSubDecimalScale. You can turn it into a plain number using the `subDecimalScaleToNumber` function. */
  notchScale: number
}

/**
 * Returns a number meaning what human-readable number can be used to fit the given value
 *
 * @param value
 * @param doRoundUp Do round to the greater number? Otherwise to the lower.
 * @returns 0 for 1, 1 for 2, 2 for 5, 3 for 10, 4 for 20, 5 for 50 and so on
 */
export function getSubDecimalScale(value: number, doRoundUp = false): number {
  const log10 = Math.log10(value)
  const log10Base = Math.floor(log10)
  const log10Remainder = modulo(log10, 1)

  if (log10 === -Infinity) {
    return -Infinity
  }

  if (log10Remainder === 0 || (!doRoundUp && log10Remainder < log10Of2)) {
    return log10Base * 3
  }
  if (log10Remainder <= log10Of2 || (!doRoundUp && log10Remainder < log10Of5)) {
    return log10Base * 3 + 1
  }
  if (log10Remainder <= log10Of5 || !doRoundUp) {
    return log10Base * 3 + 2
  }
  return log10Base * 3 + 3
}

/**
 * Converts the result of `getSubDecimalScale` back to a plain number
 *
 * @param scale
 * @returns 1 for 0, 2 for 1, 5 for 2, 10 for 3, 20 for 4, 50 for 5 and so on
 */
export function subDecimalScaleToNumber(scale: number): number {
  const base = 10 ** Math.floor(scale / 3)
  const remainder = modulo(scale, 3)

  if (remainder < 1) {
    return base
  }
  if (remainder < 2) {
    return base * 2
  }
  return base * 5
}

/**
 * Calculates the scale to show the given value range with the given notch count.
 *
 * @param rangeSize The difference between the highest and the lowest value to show
 * @param maxNotchCount
 * @return The number as getSubDecimalScale returns
 */
export function getScaleToFitRange(rangeSize: number, maxNotchCount = 5): number {
  return getSubDecimalScale(Math.max(1e-12, Math.abs(rangeSize / maxNotchCount)), true)
}

/**
 * Calculates the scale such way that the notches always stay in the same place unless the `notchCount` argument value
 * is changed.
 *
 * @param minValue The minimum value to fit on the scale
 * @param maxValue The maximum value to fit on the scale
 * @param notchCount The number of notches to render. May be fractional (will be aligned to the minimal value).
 */
export function getValueRangeForFixedNotches(minValue: number, maxValue: number, notchCount = 5): DecimalScaleState {
  function getValueRange(notchScale: number) {
    const notchValue = subDecimalScaleToNumber(notchScale)
    const alignedMinValue = floorWithBase(minValue, notchValue)
    const alignedMaxValue = alignedMinValue + notchValue * notchCount
    return [alignedMinValue, alignedMaxValue]
  }

  let notchScale = getScaleToFitRange(maxValue - minValue, notchCount)
  let [min, max] = getValueRange(notchScale)

  if (max < maxValue) {
    ;[min, max] = getValueRange(++notchScale)
  }

  return { min, max, notchScale }
}

/**
 * Calculates the scale such way that the lowest notch is always at the bottom.
 *
 * @see getValueRangeForFixedNotches for arguments and return value
 */
export function getValueRangeForFixedBottom(minValue: number, maxValue: number, maxNotchCount = 5): DecimalScaleState {
  const { min, notchScale } = getValueRangeForFixedNotches(minValue, maxValue, maxNotchCount)
  return { min, max: maxValue, notchScale }
}

/**
 * Returns a set of notches positions to display on a ruler (scale).
 * The `notchScale` value can be fractional.
 */
export function* listSubDecimalNotchesForRange(
  minValue: number,
  maxValue: number,
  notchScale: number,
): Generator<{ value: number; opacity: number }, void> {
  const notch1Size = subDecimalScaleToNumber(Math.floor(notchScale))
  const notch2Size = subDecimalScaleToNumber(Math.ceil(notchScale))
  const transition = modulo(notchScale, 1)
  const start1Notch = ceilWithBase(minValue, notch1Size)
  const start2Notch = ceilWithBase(minValue, notch2Size)

  for (let notch1 = start1Notch, notch2 = start2Notch; notch1 <= maxValue || notch2 <= maxValue; ) {
    if (notch1 === notch2) {
      yield { value: notch1, opacity: 1 }
      notch1 = alignValue(notch1 + notch1Size)
      notch2 = alignValue(notch2 + notch2Size)
    } else if (notch1 < notch2) {
      yield { value: notch1, opacity: 1 - transition }
      notch1 = alignValue(notch1 + notch1Size)
    } else {
      yield { value: notch2, opacity: transition }
      notch2 = alignValue(notch2 + notch2Size)
    }
  }
}

/**
 * Aims to solve the 0.1 + 0.2 problem
 */
function alignValue(value: number): number {
  // The maximum required precision for this app is 1e-8
  return roundWithBase(value, 1e-10)
}
