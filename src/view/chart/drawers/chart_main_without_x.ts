import memoizeObjectArguments from '../../../utils/memoize_object_arguments'
import { chartSidePadding, chartMainLinesTopMargin, chartMainFadeHeight, chartMainLineWidth } from '../../style'
import { LinesList } from '../types'
import drawLinesGroup from './lines_group'
import drawValueScale from './value_scale'
import makeFade from './fade'
import drawColumnPointerLine from './column_pointer_line'
import drawColumnPointerCircles from './column_pointer_circles'

interface Options {
  linesData: LinesList
  x: number
  y: number
  width: number
  height: number
  pixelRatio: number
  minValue: number
  maxValue: number
  valueNotchScale: number
  startIndex: number
  endIndex: number
  detailsIndex: number
  detailsOpacity: number
  _?: unknown
}

export default function makeChartMainWithoutX(
  ctx: CanvasRenderingContext2D,
): (options: Options, lineOpacities: readonly number[]) => void {
  const drawTopFade = makeFade(ctx, 'top')
  const drawLeftFade = makeFade(ctx, 'left')
  const drawRightFade = makeFade(ctx, 'right')

  return memoizeObjectArguments(
    (
      {
        linesData,
        x,
        y,
        width,
        height,
        pixelRatio,
        minValue,
        maxValue,
        valueNotchScale,
        startIndex,
        endIndex,
        detailsIndex,
        detailsOpacity,
      },
      lineOpacities,
    ) => {
      const mainLinesX = x + chartSidePadding * pixelRatio
      const mainLinesY = y + chartMainLinesTopMargin * pixelRatio
      const mainLinesWidth = width - chartSidePadding * pixelRatio * 2
      const mainLinesHeight = height - chartMainLinesTopMargin * pixelRatio

      ctx.save()
      ctx.clearRect(x, y, width, height)
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()

      const commonArguments = {
        ctx,
        pixelRatio,
      }

      drawLinesGroup({
        ctx,
        linesData,
        lineOpacities,
        x,
        width,
        fromX: mainLinesX,
        toX: mainLinesX + mainLinesWidth,
        fromIndex: startIndex,
        toIndex: endIndex,
        fromY: mainLinesY + mainLinesHeight,
        toY: mainLinesY,
        fromValue: minValue,
        toValue: maxValue,
        lineWidth: chartMainLineWidth * pixelRatio,
      })

      drawValueScale({
        ...commonArguments,
        x: mainLinesX,
        y,
        width: mainLinesWidth,
        height,
        topPadding: mainLinesY - y,
        fromValue: minValue,
        toValue: maxValue,
        notchScale: valueNotchScale,
      })

      drawTopFade(x, y, width, chartMainFadeHeight * pixelRatio)
      drawLeftFade(x, y, x + width - mainLinesX - mainLinesWidth, height)
      drawRightFade(mainLinesX + mainLinesWidth, y, x + width - mainLinesX - mainLinesWidth, height)

      ctx.restore()

      // The details pointer
      if (detailsOpacity > 0) {
        const detailsX = mainLinesX + (mainLinesWidth * (detailsIndex - startIndex)) / (endIndex - startIndex)

        drawColumnPointerLine({
          ...commonArguments,
          x: detailsX,
          y: mainLinesY,
          height: mainLinesHeight,
          opacity: detailsOpacity,
          drawFromX: x,
          drawToX: x + width,
        })

        drawColumnPointerCircles({
          ...commonArguments,
          linesData,
          lineOpacities,
          x: detailsX,
          y: mainLinesY,
          height: mainLinesHeight,
          index: detailsIndex,
          opacity: detailsOpacity,
          fromValue: minValue,
          toValue: maxValue,
          drawFromX: x,
          drawToX: x + width,
        })
      }
    },
  )
}
