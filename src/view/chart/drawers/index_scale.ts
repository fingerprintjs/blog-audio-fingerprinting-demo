import { numberColorToRGBA } from '../../../utils/color'
import { listSubDecimalNotchesForRange } from '../../../utils/scale'
import { formatNumberWithThousandGroups } from '../../../utils/number'
import {
  chartScaleLabelColor,
  chartScaleLabelFontSize,
  chartValueScaleMinSpaceForNotch,
  getFontFamily,
} from '../../style'

interface Options {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  pixelRatio: number
  fromX: number
  toX: number
  fromIndex: number
  toIndex: number
  /** See the `getSubDecimalScale` function. It can be fractional, in this case a transitional state is rendered. */
  notchScale: number
}

export default function drawDateScale({
  ctx,
  x,
  y,
  width,
  pixelRatio,
  fromX,
  toX,
  fromIndex,
  toIndex,
  notchScale,
}: Options): void {
  if (fromIndex === toIndex) {
    return
  }

  const approximateLabelMaxWidth = chartValueScaleMinSpaceForNotch * 0.9

  ctx.font = `${Math.round(chartScaleLabelFontSize * pixelRatio)}px/1 ${getFontFamily()}`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'

  const realFromX = x - approximateLabelMaxWidth / 2
  const realToX = x + width + approximateLabelMaxWidth / 2
  const xPerIndex = (toX - fromX) / (toIndex - fromIndex || 1)
  const realFromIndex = fromIndex - (xPerIndex === 0 ? 0 : (fromX - realFromX) / xPerIndex)
  const realToIndex = toIndex + (xPerIndex === 0 ? 0 : (realToX - toX) / xPerIndex)

  const notchGenerator = listSubDecimalNotchesForRange(realFromIndex, realToIndex, notchScale)
  for (;;) {
    const iteration = notchGenerator.next()
    if (iteration.done) {
      break
    }

    const { value: index, opacity } = iteration.value
    const x = fromX + (index - fromIndex) * xPerIndex

    ctx.fillStyle = numberColorToRGBA(chartScaleLabelColor, opacity)
    ctx.fillText(formatNumberWithThousandGroups(index), Math.round(x), y)
  }
}
