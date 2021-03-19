import * as React from 'react'
import { chartMapBottom, chartMapCornerRadius, chartMapHeight, chartSidePadding } from '../style'
import Controller from './controller'
import { LinesList } from './types'
import * as style from './chart.css'

interface Props {
  lines: LinesList
  /** The number to show under the first values on the chart */
  actualFirstIndex?: number
  minSelectionLength?: number
  maxSelectionLength?: number
  initialSelectionLength?: number
  maxBottomValue?: number
  minTopValue?: number
  detailsPopupWidth?: number
  /** The number of digits after the fractional dot */
  detailsPopupValuePrecision?: number | null
  className?: string
}

/**
 * Draws a chart with lines.
 */
function Chart({
  lines,
  actualFirstIndex = 0,
  initialSelectionLength = 100,
  minSelectionLength = 10,
  maxSelectionLength = 500,
  maxBottomValue = Infinity,
  minTopValue = -Infinity,
  detailsPopupWidth = 200,
  detailsPopupValuePrecision,
  className = '',
}: Props) {
  const gestureContainerRef = React.useRef<HTMLDivElement>(null)
  const mainCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const mapCanvasRef = React.useRef<HTMLCanvasElement>(null)
  const controllerRef = React.useRef<Controller>()

  React.useEffect(() => {
    const options = { maxBottomValue, minTopValue, detailsPopupWidth, detailsPopupValuePrecision }

    if (controllerRef.current) {
      controllerRef.current.setLines(lines, actualFirstIndex, minSelectionLength, maxSelectionLength)
      controllerRef.current?.setOptions(options)
    } else {
      controllerRef.current = new Controller(
        gestureContainerRef.current!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        mainCanvasRef.current!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        mapCanvasRef.current!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        lines,
        actualFirstIndex,
        minSelectionLength,
        maxSelectionLength,
        initialSelectionLength,
        options,
      )
    }
  }, [
    lines,
    actualFirstIndex,
    minSelectionLength,
    maxSelectionLength,
    maxBottomValue,
    minTopValue,
    detailsPopupWidth,
    detailsPopupValuePrecision,
  ])

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
