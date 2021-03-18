import * as React from 'react'
import * as styles from './loading_screen.css'

interface Props {
  fullAbsolute?: boolean
  className?: string
}

export default function LoadingScreen({ fullAbsolute, className = '' }: Props): React.ReactElement {
  return <div className={`${styles.box} ${fullAbsolute ? styles.full : ''} ${className}`}>Loading...</div>
}
