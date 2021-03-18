import * as React from 'react'
import { roundWithBase } from '../../utils/number'
import * as styles from './range.css'

interface Props {
  value: number
  min: number
  max: number
  step: number
  isExponential?: boolean
  onChange?(value: number): unknown
  className?: string
}

/**
 * The styles are copied from
 * https://github.com/fingerprintjs/fingerprintjs.com/blob/ec606633be/src/components/common/RangeSlider/index.tsx
 */
const Range = React.memo(function Range({ value, min, max, step, isExponential, onChange, className = '' }: Props) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      const value = inputValueToPropValue(Number(event.target.value), isExponential)
      onChange(alignToStep(value, step))
    }
  }

  const inputValue = propValueToInputValue(value, isExponential)
  const inputMin = propValueToInputValue(min, isExponential)
  const inputMax = propValueToInputValue(max, isExponential)

  const thumbSize = 18
  const ratio = (inputValue - inputMin) / (inputMax - inputMin)
  const sliderOffsetCss = `calc(${ratio * 100}% + ${thumbSize / 2}px - ${thumbSize * ratio}px)`

  return (
    <div
      className={`${styles.inputContainer} ${className}`}
      style={{ '--left': sliderOffsetCss, '--thumb-size': `${thumbSize}px` } as React.CSSProperties}
    >
      <input
        type="range"
        value={inputValue}
        min={inputMin}
        max={inputMax}
        step={(inputMax - inputMin) / 10000}
        onChange={handleChange}
        className={styles.input}
      />
    </div>
  )
})

export default Range

function propValueToInputValue(value: number, isExponential: boolean | undefined) {
  return isExponential ? Math.log(Math.max(1e-12, value)) : value
}

function inputValueToPropValue(value: number, isExponential: boolean | undefined) {
  return isExponential ? Math.exp(value) : value
}

function alignToStep(value: number, step: number) {
  return roundWithBase(value, step)
}
