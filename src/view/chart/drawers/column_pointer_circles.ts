import { numberColorToRGBA } from '../../../utils/color'
import { interpolateLinear } from '../../../utils/data'
import { chartLinePointerRadius, chartMainLineWidth, getBackgroundColor } from '../../style'
import { LinesList } from '../types'

interface Options {
  ctx: CanvasRenderingContext2D
  pixelRatio: number
  linesData: LinesList
  lineOpacities: readonly number[]
  x: number
  y: number
  height: number
  /** May be fractional */
  index: number
  opacity: number
  fromY?: number
  toY?: number
  fromValue: number
  toValue: number
  drawFromX?: number
  drawToX?: number
}

export default function drawLinesPointer({
  ctx,
  pixelRatio,
  linesData,
  lineOpacities,
  x,
  y,
  height,
  index,
  opacity,
  fromY = y + height,
  toY = y,
  fromValue,
  toValue,
  drawFromX = -Infinity,
  drawToX = Infinity,
}: Options): void {
  if (opacity <= 0 || fromValue === toValue) {
    return
  }

  const pointRadius = chartLinePointerRadius * pixelRatio
  const borderWidth = chartMainLineWidth * pixelRatio

  x = Math.round(x)
  // eslint-disable-next-line prettier/prettier
  if (
    x + pointRadius + borderWidth / 2 <= drawFromX ||
    x - pointRadius - borderWidth / 2 >= drawToX
  ) {
    return
  }

  const yPerValue = (toY - fromY) / (toValue - fromValue)
  const pointBackgroundColor = getBackgroundColor()
  ctx.lineWidth = borderWidth

  // Render the lines in backward order so that the first line is rendered on top
  for (let key = linesData.length - 1; key >= 0; --key) {
    const value = interpolateLinear(linesData[key].values, index)
    if (value === undefined) {
      continue // Can happen when one line is longer than another
    }

    const y = fromY + (value - fromValue) * yPerValue
    const scale = 0.3 + opacity * 0.7

    ctx.fillStyle = numberColorToRGBA(pointBackgroundColor, lineOpacities[key] * opacity)
    ctx.strokeStyle = numberColorToRGBA(linesData[key].color, lineOpacities[key] * opacity)
    ctx.beginPath()
    ctx.arc(x, y, pointRadius * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
}
