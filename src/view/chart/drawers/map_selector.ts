import { numberColorToRGBA } from '../../../utils/color'
import { roundedRectanglePath } from '../../../utils/canvas'
import {
  chartMapCornerRadius,
  chartSelectorBorderCornerRadius,
  chartSelectorOutsideColor,
  chartSelectorOutsideOpacity,
  chartSelectorBorderColor,
  chartSelectorNotchColor,
  chartSelectorGripWidth,
  chartSelectorVerticalPadding,
  chartSelectorNotchWidth,
  chartSelectorNotchHeight,
  chartSelectorNotchCornerRadius,
} from '../../style'

interface Options {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  from: number
  to: number
  pixelRatio: number
}

export default function drawMapSelector({ ctx, x, y, width, height, from, to, pixelRatio }: Options): void {
  const sideBorderWidth = chartSelectorGripWidth * pixelRatio
  const outsideCornerRadius = chartMapCornerRadius * pixelRatio
  const verticalPadding = chartSelectorVerticalPadding * pixelRatio

  const leftOffset = Math.round(from * width) - sideBorderWidth
  const rightOffset = Math.round(to * width) + sideBorderWidth
  const notchColor = numberColorToRGBA(chartSelectorNotchColor)

  ctx.beginPath()
  ctx.fillStyle = numberColorToRGBA(chartSelectorOutsideColor, chartSelectorOutsideOpacity)
  roundedRectanglePath(ctx, x, y, width, height, outsideCornerRadius)
  ctx.fill()

  ctx.beginPath()
  ctx.fillStyle = numberColorToRGBA(chartSelectorBorderColor)
  roundedRectanglePath(
    ctx,
    x + leftOffset,
    y + verticalPadding,
    rightOffset - leftOffset,
    height - verticalPadding * 2,
    chartSelectorBorderCornerRadius * pixelRatio,
  )
  ctx.fill()

  drawNotch(ctx, x + leftOffset + sideBorderWidth / 2, y + height / 2, notchColor, pixelRatio)
  drawNotch(ctx, x + rightOffset - sideBorderWidth / 2, y + height / 2, notchColor, pixelRatio)

  ctx.clearRect(x + leftOffset + sideBorderWidth, y, rightOffset - leftOffset - sideBorderWidth * 2, height)
}

function drawNotch(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cssColor: string,
  pixelRatio: number,
) {
  const width = chartSelectorNotchWidth * pixelRatio
  const height = chartSelectorNotchHeight * pixelRatio
  const radius = chartSelectorNotchCornerRadius * pixelRatio

  ctx.beginPath()
  ctx.fillStyle = cssColor
  roundedRectanglePath(ctx, centerX - width / 2, centerY - height / 2, width, height, radius)
  ctx.fill()
}
