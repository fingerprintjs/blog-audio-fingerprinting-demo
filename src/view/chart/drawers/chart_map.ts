import memoizeObjectArguments from '../../../utils/memoize_object_arguments'
import { chartMapLinesHorizontalMargin, chartMapLinesVerticalMargin, chartMapLineWidth } from '../../style'
import { LinesList } from '../types'
import drawLinesGroup from './lines_group'

interface Options {
  linesData: LinesList
  canvasWidth: number
  canvasHeight: number
  minIndex: number
  maxIndex: number
  minValue: number
  maxValue: number
  pixelRatio: number
}

export default function makeChartMap(
  ctx: CanvasRenderingContext2D,
): (options: Options, lineOpacities: readonly number[]) => void {
  return memoizeObjectArguments(
    ({ linesData, canvasWidth, canvasHeight, minIndex, maxIndex, minValue, maxValue, pixelRatio }, lineOpacities) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      drawLinesGroup({
        ctx,
        linesData,
        lineOpacities,
        x: 0,
        width: canvasWidth,
        fromX: chartMapLinesHorizontalMargin * pixelRatio,
        toX: canvasWidth - chartMapLinesHorizontalMargin * pixelRatio,
        fromIndex: minIndex,
        toIndex: maxIndex,
        fromY: canvasHeight - chartMapLinesVerticalMargin * pixelRatio,
        toY: chartMapLinesVerticalMargin * pixelRatio,
        fromValue: minValue,
        toValue: maxValue,
        lineWidth: chartMapLineWidth * pixelRatio,
      })
    },
  )
}
