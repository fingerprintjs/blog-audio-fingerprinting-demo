import * as React from 'react'
import { chartMapBottom, chartMapCornerRadius, chartMapHeight, chartSidePadding } from '../style'
import Controller from './controller'
import { Line } from './types'
import * as style from './chart.css'

interface Props {
  lines: readonly Readonly<Line>[]
  className?: string
}

/**
 * Draws a chart with lines.
 */
function Chart({ lines, className = '' }: Props) {
  const gestureContainerRef = React.useRef<HTMLDivElement>(null)
  const mainCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const mapCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const controllerRef = React.useRef<Controller>()

  React.useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setLines(lines)
    } else {
      controllerRef.current = new Controller(
        gestureContainerRef.current!,
        mainCanvasRef.current!,
        mapCanvasRef.current!,
        lines,
      )
    }
  }, [lines])

  React.useEffect(() => {
    return () => controllerRef.current?.destroy()
  }, [])

  return (
    <div className={`${style.box} ${className}`} ref={gestureContainerRef}>
      <canvas
        className={style.map}
        style={{
          left: `${chartSidePadding}px`,
          bottom: `${chartMapBottom}px`,
          width: `calc(100% - ${chartSidePadding * 2}px)`,
          height: `${chartMapHeight}px`,
          borderRadius: `${chartMapCornerRadius}px`,
        }}
        ref={mapCanvasRef}
      />
      <canvas className={style.main} ref={mainCanvasRef} />
    </div>
  )
}

export default React.memo(Chart)
