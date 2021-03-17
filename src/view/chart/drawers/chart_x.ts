import memoizeObjectArguments from '../../../utils/memoize_object_arguments'
import { chartSidePadding, chartDateScaleLabelMargin, chartMapHeight, chartMapBottom } from '../../style'
import drawIndexScale from './index_scale'
import drawMapSelector from './map_selector'

interface Options {
  x: number
  y: number
  width: number
  height: number
  pixelRatio: number
  minIndex: number
  maxIndex: number
  startIndex: number
  endIndex: number
  indexNotchScale: number
  _: unknown
}

export default function makeChartX(ctx: CanvasRenderingContext2D): (options: Options) => void {
  return memoizeObjectArguments(
    ({ x, y, width, height, pixelRatio, minIndex, maxIndex, startIndex, endIndex, indexNotchScale }) => {
      ctx.clearRect(x, y, width, height)

      drawIndexScale({
        ctx,
        x: x,
        y: y + chartDateScaleLabelMargin * pixelRatio,
        width: width,
        fromX: x + chartSidePadding * pixelRatio,
        toX: x + width - chartSidePadding * pixelRatio,
        fromIndex: startIndex,
        toIndex: endIndex,
        notchScale: indexNotchScale,
        pixelRatio,
      })

      if (minIndex !== maxIndex) {
        drawMapSelector({
          ctx,
          x: x + chartSidePadding * pixelRatio,
          y: y + height - (chartMapHeight + chartMapBottom) * pixelRatio,
          width: width - chartSidePadding * pixelRatio * 2,
          height: chartMapHeight * pixelRatio,
          from: (startIndex - minIndex) / (maxIndex - minIndex),
          to: (endIndex - minIndex) / (maxIndex - minIndex),
          pixelRatio,
        })
      }
    },
  )
}
