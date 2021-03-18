import * as React from 'react'
import * as styles from './section_header.css'

interface Props {
  children?: React.ReactNode
  className?: string
}

export default function SectionHeader({ className = '', ...props }: Props): React.ReactElement {
  return <div className={`${styles.header} ${className}`} {...props} />
}
