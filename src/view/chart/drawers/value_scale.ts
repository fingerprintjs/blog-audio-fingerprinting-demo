import { formatNumberToShortForm } from '../../../utils/number'
import { numberColorToRGBA } from '../../../utils/color'
import { listSubDecimalNotchesForRange } from '../../../utils/scale'
import {
  getFontFamily,
  getBackgroundColor,
  chartScaleLineColor,
  chartScaleLineOpacity,
  chartScaleLineWidth,
  chartScaleLabelColor,
  chartScaleLabelFontSize,
  chartValueScaleLabelMargin,
  chartScaleLabelUnderlayOpacity,
  chartScaleLabelUnderlayPadding,
} from '../../style'

interface Options {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  fromValue: number
  toValue: number
  /** See the `getSubDecimalScale` function. It can be fractional, in this case a transitional state is rendered. */
  notchScale: number
  topPadding?: number
  pixelRatio: number
  drawLines?: boolean
  labelColor?: number
  labelOpacity?: number
  labelOnRight?: boolean
}

export default function drawValueScale({
  ctx,
  x,
  y,
  width,
  height,
  fromValue,
  toValue,
  notchScale,
  topPadding = 0,
  pixelRatio,
  drawLines = true,
  labelColor = chartScaleLabelColor,
  labelOpacity = 1,
  labelOnRight,
}: Options): void {
  if (isNaN(fromValue) || isNaN(toValue) || !isFinite(fromValue) || !isFinite(toValue) || height === topPadding) {
    return
  }

  if (!drawLines && labelOpacity <= 0) {
    return
  }

  const lineWidth = chartScaleLineWidth * pixelRatio
  const fontSize = Math.round(chartScaleLabelFontSize * pixelRatio)
  const backgroundColor = getBackgroundColor()
  const labelOffset = chartValueScaleLabelMargin * pixelRatio
  const labelBottomExtraSpace = fontSize + labelOffset
  const labelX = x + (labelOnRight ? width : 0)
  const labelUnderlayPadding = chartScaleLabelUnderlayPadding * pixelRatio
  const labelUnderlayHeight = fontSize + labelUnderlayPadding * 2

  const yPerValue = (height - topPadding) / (toValue - fromValue || 1)
  const realFromValue = fromValue - (yPerValue === 0 ? 0 : labelBottomExtraSpace / yPerValue)
  const realToValue = toValue + (yPerValue === 0 ? 0 : topPadding / yPerValue)

  ctx.font = `${fontSize}px/1 ${getFontFamily()}`
  ctx.textBaseline = 'bottom'
  ctx.textAlign = labelOnRight ? 'right' : 'left'

  if (drawLines) {
    ctx.fillStyle = numberColorToRGBA(chartScaleLineColor, chartScaleLineOpacity)
    ctx.fillRect(x, y + height - lineWidth, width, lineWidth)
  }

  const notchGenerator = listSubDecimalNotchesForRange(realFromValue, realToValue, notchScale)
  for (;;) {
    const iteration = notchGenerator.next()
    if (iteration.done) {
      break
    }

    const { value, opacity } = iteration.value
    const notchY = Math.round(y + height - (value - fromValue) * yPerValue)

    if (drawLines && notchY < y + height) {
      ctx.fillStyle = numberColorToRGBA(chartScaleLineColor, chartScaleLineOpacity * opacity)
      ctx.fillRect(x, notchY - lineWidth, width, lineWidth)
    }

    if (labelOpacity > 0 && notchY > y + labelOffset) {
      const text = formatNumberToShortForm(value)

      // Underlay for better number visibility
      if (chartScaleLabelUnderlayOpacity > 0) {
        const width = Math.round(ctx.measureText(text).width) + labelUnderlayPadding * 2
        ctx.fillStyle = numberColorToRGBA(backgroundColor, chartScaleLabelUnderlayOpacity * labelOpacity * opacity)
        ctx.fillRect(
          labelX - (labelOnRight ? width - labelUnderlayPadding : labelUnderlayPadding),
          notchY - labelOffset + labelUnderlayPadding - labelUnderlayHeight,
          width,
          labelUnderlayHeight,
        )
      }

      ctx.fillStyle = numberColorToRGBA(labelColor, labelOpacity * opacity)
      ctx.fillText(text, labelX, notchY - labelOffset)
    }
  }
}
