import * as React from 'react'
import * as styles from './layout.css'

interface Props {
  content: React.ReactNode
  controls: React.ReactNode
}

/**
 * A full-screen layout for the demos
 */
export default function Layout({ content, controls }: Props): React.ReactElement {
  return (
    <div className={styles.body}>
      <div className={styles.content}>{content}</div>
      <div className={styles.controls}>{controls}</div>
    </div>
  )
}
