import * as React from 'react'
import * as styles from './form.css'

export interface Field {
  label: React.ReactNode
  value?: React.ReactNode
  input: React.ReactNode
  key?: React.Key
}

interface Props {
  fields: Field[]
  className?: string
}

export default function Form({ fields, className = '' }: Props): React.ReactElement {
  return (
    <div className={`${styles.list} ${className}`}>
      {fields.map(({ label, value, input, key }, index) => (
        <div className={styles.field} key={key ?? index}>
          <div className={styles.label}>{label}</div>
          {value !== undefined && <div className={styles.value}>{value}</div>}
          <div className={styles.input}>{input}</div>
        </div>
      ))}
    </div>
  )
}
