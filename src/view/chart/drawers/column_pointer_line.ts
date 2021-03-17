import { numberColorToRGBA } from '../../../utils/color'
import { chartScaleLineColor, chartScaleLineOpacity, chartScaleLineWidth } from '../../style'

interface Options {
  ctx: CanvasRenderingContext2D
  pixelRatio: number
  x: number
  y: number
  height: number
  opacity: number
  drawFromX?: number
  drawToX?: number
}

export default function drawColumnPointerLine({
  ctx,
  pixelRatio,
  x,
  y,
  height,
  opacity,
  drawFromX = -Infinity,
  drawToX = Infinity,
}: Options): void {
  if (opacity <= 0) {
    return
  }

  const lineWidth = chartScaleLineWidth * pixelRatio
  const lineX = Math.round(x - lineWidth / 2)

  if (lineX + lineWidth <= drawFromX || lineX >= drawToX) {
    return
  }

  ctx.fillStyle = numberColorToRGBA(chartScaleLineColor, chartScaleLineOpacity * opacity)
  ctx.fillRect(lineX, y, lineWidth, height)
}
