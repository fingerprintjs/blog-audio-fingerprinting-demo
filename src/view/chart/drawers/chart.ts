import memoizeOne from 'memoize-one'
import {
  chartMainLinesBottomMargin,
  chartMapHeight,
  chartMapBottom,
  chartMainTopMargin,
  chartSidePadding,
  chartDetailsPopupY,
  chartDetailsPopupXMargin,
  chartDetailsPopupWidth,
  chartDetailsPopupMinDistanceToEdge,
} from '../../style'
import { LinesList } from '../types'
import makeChartMainWithoutX from './chart_main_without_x'
import makeChartX from './chart_x'
import makeChartMap from './chart_map'
import drawDetailsPopup from './details_popup'

interface Options {
  linesData: LinesList
  mainCanvasWidth: number
  mainCanvasHeight: number
  mapCanvasWidth: number
  mapCanvasHeight: number
  pixelRatio: number
  minIndex: number
  maxIndex: number
  mapMinValue: number
  mapMaxValue: number
  mainMinValue: number
  mainMaxValue: number
  mainValueNotchScale: number
  indexNotchScale: number
  startIndex: number
  endIndex: number
  detailsIndex: number
  /** 0 - to the left of the pointer, 1 - to the right */
  detailsAlign: number
  detailsOpacity: number
}

export default function makeChart(
  mainCanvas: HTMLCanvasElement,
  mapCanvas: HTMLCanvasElement,
): (options: Options, lineOpacities: readonly number[]) => void {
  const mainCtx = mainCanvas.getContext('2d')
  const mapCtx = mapCanvas.getContext('2d')

  if (!mainCtx || !mapCtx) {
    throw new Error('Canvas 2d context unavailable')
  }

  const updateMainCanvasSize = memoizeOne((width, height) => {
    mainCanvas.width = width
    mainCanvas.height = height
    ++forceRedrawMainCanvas
  })

  const updateMapCanvasSize = memoizeOne((width, height) => {
    mapCanvas.width = width
    mapCanvas.height = height
  })

  // The parts of the chart that can be updated independently
  const drawChartMainWithoutX = makeChartMainWithoutX(mainCtx)
  const drawChartX = makeChartX(mainCtx)
  const drawChartMap = makeChartMap(mapCtx)

  let wasDetailsPopupDrawn = false
  let forceRedrawMainCanvas = 0

  return (
    {
      linesData,
      mainCanvasWidth,
      mainCanvasHeight,
      mapCanvasWidth,
      mapCanvasHeight,
      pixelRatio,
      minIndex,
      maxIndex,
      mapMinValue,
      mapMaxValue,
      mainMinValue,
      mainMaxValue,
      mainValueNotchScale,
      indexNotchScale,
      startIndex,
      endIndex,
      detailsIndex,
      detailsAlign,
      detailsOpacity,
    },
    lineOpacities,
  ) => {
    const mainSectionY = chartMainTopMargin * pixelRatio
    const mainSectionHeight =
      mainCanvasHeight - (chartMainLinesBottomMargin + chartMapHeight + chartMapBottom) * pixelRatio - mainSectionY
    const doDrawDetailsPopup = detailsOpacity > 0 && detailsIndex !== null

    updateMainCanvasSize(mainCanvasWidth, mainCanvasHeight)
    updateMapCanvasSize(mapCanvasWidth, mapCanvasHeight)

    if (doDrawDetailsPopup) {
      mainCtx.clearRect(0, 0, mainCanvasWidth, mainCanvasHeight)
      forceRedrawMainCanvas++
      wasDetailsPopupDrawn = true
    } else if (wasDetailsPopupDrawn) {
      forceRedrawMainCanvas++
      wasDetailsPopupDrawn = false
    }

    drawChartMainWithoutX(
      {
        linesData,
        x: 0,
        y: mainSectionY,
        width: mainCanvasWidth,
        height: mainSectionHeight,
        minValue: mainMinValue,
        maxValue: mainMaxValue,
        valueNotchScale: mainValueNotchScale,
        startIndex,
        endIndex,
        detailsIndex,
        detailsOpacity,
        pixelRatio,
        _: forceRedrawMainCanvas,
      },
      lineOpacities,
    )

    drawChartX({
      x: 0,
      y: mainSectionY + mainSectionHeight,
      width: mainCanvasWidth,
      height: mainCanvasHeight - mainSectionY - mainSectionHeight,
      minIndex,
      maxIndex,
      startIndex,
      endIndex,
      indexNotchScale,
      pixelRatio,
      _: forceRedrawMainCanvas,
    })

    if (doDrawDetailsPopup) {
      drawDetailsPopup({
        linesData,
        x: Math.round(getDetailsPopupX(mainCanvasWidth, pixelRatio, detailsIndex, startIndex, endIndex, detailsAlign)),
        y: chartDetailsPopupY * pixelRatio,
        ctx: mainCtx,
        pixelRatio,
        lineOpacities,
        index: detailsIndex,
        opacity: detailsOpacity,
      })
    }

    drawChartMap(
      {
        linesData,
        canvasWidth: mapCanvasWidth,
        canvasHeight: mapCanvasHeight,
        minIndex,
        maxIndex,
        minValue: mapMinValue,
        maxValue: mapMaxValue,
        pixelRatio,
      },
      lineOpacities,
    )
  }
}

function getDetailsPopupX(
  canvasWidth: number,
  pixelRatio: number,
  detailsIndex: number,
  startIndex: number,
  endIndex: number,
  align: number,
) {
  const pointerX =
    chartSidePadding * pixelRatio +
    ((canvasWidth - chartSidePadding * 2 * pixelRatio) * (detailsIndex - startIndex)) / (endIndex - startIndex)

  const xOnLeftAlign = Math.max(
    chartDetailsPopupMinDistanceToEdge * pixelRatio,
    pointerX - (chartDetailsPopupWidth + chartDetailsPopupXMargin) * pixelRatio,
  )
  const xOnRightAlign = Math.min(
    canvasWidth - (chartDetailsPopupMinDistanceToEdge + chartDetailsPopupWidth) * pixelRatio,
    pointerX + chartDetailsPopupXMargin * pixelRatio,
  )

  return xOnLeftAlign * (1 - align) + xOnRightAlign * align
}
