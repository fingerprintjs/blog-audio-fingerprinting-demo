/* eslint-disable no-unused-vars */ // ESLint glitches hare for some reason
import * as React from 'react'
import { toggleArrayItem } from '../../utils/data'
import * as style from './toggle_button_group.css'
import ToggleButton from './toggle_button'

export interface Button<T> {
  /** CSS color */
  color: string
  text: string
  value: T
  key?: React.Key
}

interface Props<T> {
  buttons: Button<T>[]
  on: T[]
  onSwitch(on: T[]): unknown
  className?: string
}

const ToggleButtonGroup = React.memo(function ToggleButtonGroup<T>({
  buttons,
  on,
  onSwitch,
  className = '',
}: Props<T>) {
  const onLongClick = (value: T) => {
    if (on.length === 1 && on[0] === value) {
      onSwitch(buttons.map((button) => button.value))
    } else {
      onSwitch([value])
    }
  }

  return (
    <div className={`${style.list} ${className}`}>
      {buttons.map(({ color, text, value, key }, index) => (
        <ToggleButton
          color={color}
          text={text}
          on={on.includes(value)}
          onClick={() => onSwitch(toggleArrayItem(on, value))}
          onLongClick={() => onLongClick(value)}
          className={style.item}
          key={key ?? index}
        />
      ))}
    </div>
  )
}) as <T>(props: Props<T>) => React.ReactElement

export default ToggleButtonGroup
