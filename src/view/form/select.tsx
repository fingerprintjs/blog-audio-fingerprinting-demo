import * as React from 'react'
import * as styles from './select.css'

interface Option<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface Props<T extends string> {
  options: readonly Readonly<Option<T>>[]
  selected: string
  onSelect?(selected: T): unknown
  className?: string
}

const Select = React.memo(function Select<T extends string>({ options, selected, onSelect, className = '' }: Props<T>) {
  return (
    <div className={`${styles.box} ${className}`}>
      <select value={selected} className={styles.select} onChange={(event) => onSelect?.(event.target.value as T)}>
        {options.map(({ value, label, disabled }, index) => (
          <option value={value} disabled={disabled} key={index}>
            {label}
          </option>
        ))}
      </select>
      <span className={styles.icon} />
    </div>
  )
}) as <T extends string>(props: Props<T>) => React.ReactElement

export default Select
