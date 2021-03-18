import * as React from 'react'
import { watchLongTap } from '../../utils/gesture'
import * as style from './toggle_button.css'

interface Props {
  /** CSS color */
  color: string
  text: string
  on: boolean
  onClick?(): void
  onLongClick?(): void
  className?: string
}

export default function ToggleButton({
  color,
  text,
  on,
  onClick,
  onLongClick,
  className = '',
}: Props): React.ReactElement {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // In order not to reestablish the event listeners when the callback change
  const onClickRef = React.useRef(onClick)
  const onLongClickRef = React.useRef(onLongClick)
  onClickRef.current = onClick
  onLongClickRef.current = onLongClick

  React.useEffect(() => {
    return watchLongTap(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      buttonRef.current!,
      () => onClickRef.current?.(),
      () => onLongClickRef.current?.(),
    ).destroy
  }, [])

  return (
    <button
      className={`${style.button} ${on ? style.on : ''} ${className}`}
      style={{ borderColor: color }}
      ref={buttonRef}
    >
      <span className={style.background} style={{ backgroundColor: color }} />
      <span className={style.checkmark}>
        <i />
        <i />
      </span>
      <span className={style.name}>
        <span style={{ color: color }}>{text}</span>
        <span>{text}</span>
      </span>
    </button>
  )
}
