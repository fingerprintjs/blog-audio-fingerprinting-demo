import { numberColorToRGBA } from '../../../utils/color'
import { roundedRectanglePath } from '../../../utils/canvas'
import { formatNumberWithThousandGroups } from '../../../utils/number'
import {
  getFontFamily,
  getTextColor,
  chartDetailsPopupWidth,
  chartDetailsPopupSidePadding,
  chartDetailsPopupCornerRadius,
  chartDetailsPopupHeaderFontSize,
  chartDetailsPopupHeaderFontWeight,
  chartDetailsPopupHeaderBaselineY,
  chartDetailsPopupFirstRowBaselineY,
  chartDetailsPopupRowHeight,
  chartDetailsPopupBottomPadding,
  chartDetailsPopupFontSize,
  chartDetailsPopupFontWeight,
  chartDetailsPopupValueFontWeight,
  chartDetailsPopupBackgroundColor,
  chartDetailsPopupShadowColor,
  chartDetailsPopupShadowOpacity,
  chartDetailsPopupShadowXOffset,
  chartDetailsPopupShadowYOffset,
  chartDetailsPopupShadowBlur,
  chartDetailsPopupMissingValueText,
  chartDetailsPopupHeaderFontPrefix,
} from '../../style'
import { Line, LinesList } from '../types'
import drawRotatingDisplay from './rotating_display'

interface Options {
  ctx: CanvasRenderingContext2D
  linesData: LinesList
  lineOpacities: readonly number[]
  pixelRatio: number
  index: number
  opacity: number
  x: number
  y: number
  getIndexLabel: (index: number) => string
}

/**
 * `day` are set in number of days since the start of the Unix era
 * `month` are set in number of full months since 0 AC (e.g. April 2019 is 24231)
 * `year` are just year numbers
 * The `getDateComponentsForRange` function returns date components in these formats.
 * All the date numbers may be fractional.
 */
export default function drawDetailsPopup({
  ctx,
  linesData,
  lineOpacities,
  pixelRatio,
  index,
  opacity,
  x,
  y,
  getIndexLabel,
}: Options): void {
  if (opacity === 0) {
    return
  }

  const width = chartDetailsPopupWidth * pixelRatio
  const height =
    (chartDetailsPopupFirstRowBaselineY +
      (getLineRowsAmount(linesData, lineOpacities) - 1) * chartDetailsPopupRowHeight +
      chartDetailsPopupBottomPadding) *
    pixelRatio
  const sidePadding = chartDetailsPopupSidePadding * pixelRatio
  const textColor = getTextColor()
  const fontFamily = getFontFamily()

  drawBackground(ctx, pixelRatio, opacity, x, y, width, height)
  drawHeader(
    ctx,
    pixelRatio,
    fontFamily,
    textColor,
    index,
    opacity,
    x + sidePadding,
    y + chartDetailsPopupHeaderBaselineY * pixelRatio,
    getIndexLabel,
  )

  let rowY = y + chartDetailsPopupFirstRowBaselineY * pixelRatio
  for (let key = 0; key < linesData.length; ++key) {
    const rowOpacity = lineOpacities[key]

    if (rowOpacity > 0) {
      drawRow(
        ctx,
        linesData[key],
        index,
        x + sidePadding,
        rowY,
        width - sidePadding * 2,
        textColor,
        fontFamily,
        opacity * rowOpacity,
        pixelRatio,
      )
      rowY += chartDetailsPopupRowHeight * pixelRatio * rowOpacity
    }
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  pixelRatio: number,
  opacity: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  // It's much faster than drawing the real shadow
  if (chartDetailsPopupShadowOpacity > 0) {
    const quality = 1 // The less the better and slower. It makes no sense to make it higher than the pixelRatio value.
    const stepsCount = chartDetailsPopupShadowBlur / quality
    const stepOpacity = 1 - (1 - (chartDetailsPopupShadowOpacity * opacity) / 2) ** (1 / stepsCount)

    ctx.fillStyle = numberColorToRGBA(chartDetailsPopupShadowColor, stepOpacity)

    for (let i = 0; i < stepsCount; ++i) {
      const stepOffset = ((i + 1) / stepsCount) * chartDetailsPopupShadowBlur * pixelRatio

      ctx.beginPath()
      roundedRectanglePath(
        ctx,
        x - stepOffset + chartDetailsPopupShadowXOffset * pixelRatio,
        y - stepOffset + chartDetailsPopupShadowYOffset * pixelRatio,
        width + stepOffset * 2,
        height + stepOffset * 2,
        stepOffset + chartDetailsPopupCornerRadius * pixelRatio,
      )
      ctx.fill()
    }
  }

  ctx.fillStyle = numberColorToRGBA(chartDetailsPopupBackgroundColor, opacity)
  ctx.beginPath()
  roundedRectanglePath(ctx, x, y, width, height, chartDetailsPopupCornerRadius * pixelRatio)
  ctx.fill()
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  pixelRatio: number,
  fontFamily: string,
  textColor: number,
  index: number,
  opacity: number,
  x: number,
  y: number,
  getIndexLabel: (index: number) => string,
) {
  const fontSize = chartDetailsPopupHeaderFontSize * pixelRatio
  const baseline = 'alphabetic'
  let leftPosition = x

  ctx.textBaseline = baseline
  ctx.textAlign = 'left'
  ctx.font = `${
    (chartDetailsPopupHeaderFontWeight as string) === 'regular' ? '' : chartDetailsPopupHeaderFontWeight
  } ${fontSize}px ${fontFamily}`
  ctx.fillStyle = numberColorToRGBA(textColor, opacity)
  ctx.fillText(chartDetailsPopupHeaderFontPrefix, leftPosition, y)
  leftPosition += ctx.measureText(chartDetailsPopupHeaderFontPrefix).width

  drawRotatingDisplay({
    ctx,
    x: leftPosition,
    y,
    containerAlign: 'left',
    baseline,
    fontFamily,
    fontSize,
    fontWeight: chartDetailsPopupHeaderFontWeight,
    topAlign: 0.1,
    bottomAlign: 0,
    color: textColor,
    opacity,
    position: index,
    getItemText: getIndexLabel,
  })
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  { name, color, values }: Readonly<Line>,
  index: number,
  x: number,
  y: number,
  width: number,
  textColor: number,
  fontFamily: string,
  opacity: number,
  pixelRatio: number,
) {
  const fontSize = chartDetailsPopupFontSize * pixelRatio
  const baseline = 'alphabetic'

  ctx.textBaseline = baseline
  ctx.textAlign = 'left'
  ctx.font = `${
    chartDetailsPopupFontWeight === 'regular' ? '' : chartDetailsPopupFontWeight
  } ${fontSize}px ${fontFamily}`
  ctx.fillStyle = numberColorToRGBA(textColor, opacity)
  ctx.fillText(name, x, y)

  drawRotatingDisplay({
    ctx,
    x: x + width,
    y,
    position: index,
    containerAlign: 'right',
    baseline,
    fontSize,
    fontWeight: chartDetailsPopupValueFontWeight,
    fontFamily,
    opacity,
    getItemText: (index) =>
      index >= 0 && index < values.length
        ? formatNumberWithThousandGroups(values[index])
        : chartDetailsPopupMissingValueText,
    topAlign: 1,
    bottomAlign: 0.8,
    color,
  })
}

function getLineRowsAmount(linesData: LinesList, lineOpacities: readonly number[]) {
  let amount = 0

  for (let key = 0; key < linesData.length; ++key) {
    amount += lineOpacities[key]
  }

  return amount
}
