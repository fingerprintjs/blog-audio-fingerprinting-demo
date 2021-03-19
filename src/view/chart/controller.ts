import { easeQuadInOut } from 'd3-ease'
import memoizeOne from 'memoize-one'
import { fitRangeInRangeWhileKeepingLength, getArrayMinAndMax, getMinAndMaxOnRange } from '../../utils/data'
import {
  Animation,
  makeAnimationGroup,
  makeExponentialTransition,
  makeInstantWhenHiddenTransition,
  makeTransition,
  makeTransitionGroup,
} from '../../utils/animation_group'
import { inRange } from '../../utils/number'
import { getScaleToFitRange, getSubDecimalScale, getValueRangeForFixedBottom } from '../../utils/scale'
import { chartSidePadding, chartValueScaleMinSpaceForNotch, chartValueScaleMaxNotchCount } from '../style'
import makeChartDrawer from './drawers/chart'
import watchGestures, { GestureWatcher, ChartGestureState } from './watch_gestures'
import { LinesList } from './types'

type LinesMinAndMax = readonly Readonly<{ min: number; max: number }>[]
type AnimatedWriteState = Parameters<ReturnType<typeof createAnimatedState>['moveTo']>[0]

interface Options {
  /** In pixels */
  detailsPopupWidth: number
  /** The number of digits after the fractional dot */
  detailsPopupValuePrecision: number | null
  minTopValue: number
  maxBottomValue: number
}

/**
 * Manages the chart state, including the animations.
 *
 * Data flow:
 * event -> update state and caches -> update animated state -> render the canvas in the animated state callback
 *
 * Word "index" is used to represent the X axis semantic (in order not to confuse with pixels).
 * Word "value" is used to represent the Y axis semantic (in order not to confuse with pixels).
 *
 * @see https://github.com/Finesse/telegram-chart Based on
 */
export default class Controller {
  // Outside properties:
  private lines: LinesList = []
  private indexNameOffset = 0
  private minIndexRange = 10
  private maxIndexRange = 500
  private options: Options = {
    detailsPopupWidth: 200,
    detailsPopupValuePrecision: null,
    minTopValue: -Infinity,
    maxBottomValue: Infinity,
  }

  // User input state:
  private startIndex = 0 // Start of the selected map area
  private endIndex = 0 // End of the selected map area
  private detailsIndex: number | null = null

  // Caches:
  private mainCanvasWidth = 0 // In CSS pixels
  private mainCanvasHeight = 0 // In CSS pixels
  private mapCanvasWidth = 0 // In CSS pixels
  private mapCanvasHeight = 0 // In CSS pixels
  private pixelRatio = 1
  private getIndexRange = memoizeOne(getIndexRange)
  private getLinesMinAndMax = makeGetLinesMinAndMax()
  private getLineOpacities = memoizeOne(getLineOpacities)
  private getMapValueRange = memoizeOne(getMapValueRange)
  private getMainValueRange = memoizeOne(getMainValueRange)

  // All the animated state:
  private animatedState: ReturnType<typeof createAnimatedState>

  // Helper engines:
  private updateCanvases = makeChartDrawer(this.mainCanvas, this.mapCanvas)
  private gesturesWatcher: GestureWatcher

  constructor(
    gestureContainer: HTMLElement,
    private mainCanvas: HTMLCanvasElement,
    private mapCanvas: HTMLCanvasElement,
    lines: LinesList,
    /** What's the real index of the first line values */
    indexNameOffset: number,
    minIndexRange: number,
    maxIndexRange: number,
    initialIndexRange: number,
    options: Partial<Options> = {},
  ) {
    this.setDomState()
    this.setLinesState(lines, indexNameOffset, minIndexRange, maxIndexRange, initialIndexRange)
    this.options = { ...this.options, ...options }
    this.animatedState = createAnimatedState(lines.length, this.render.bind(this))
    this.animatedState.moveTo(this.getAnimatedStateTarget(), true)
    this.gesturesWatcher = watchGestures(gestureContainer, this.getStateForGestureWatcher(), {
      mapSelectorStart: this.handleStartIndexMove.bind(this),
      mapSelectorMiddle: this.handleIndexMove.bind(this),
      mapSelectorEnd: this.handleEndIndexMove.bind(this),
      detailsPosition: this.handleDetailsPositionMove.bind(this),
    })

    // Assume that the canvases are resized only when the browser window is resized
    addEventListener('resize', this.handleResize)

    this.render()
  }

  public setLines(lines: LinesList, indexNameOffset: number, minIndexRange: number, maxIndexRange: number): void {
    this.setLinesState(lines, indexNameOffset, minIndexRange, maxIndexRange)
    this.handleStateChange()
  }

  public setOptions(options: Partial<Options>): void {
    this.options = { ...this.options, ...options }
    this.handleStateChange()
  }

  /**
   * Releases the memory taken by the state manager
   */
  public destroy(): void {
    removeEventListener('resize', this.handleResize)
    this.animatedState.destroy()
    this.gesturesWatcher.destroy()
  }

  private setLinesState(
    lines: LinesList,
    indexNameOffset: number,
    minIndexRangeLength: number,
    maxIndexRangeLength: number,
    indexRangeLength?: number,
  ) {
    if (this.animatedState && this.lines.length !== lines.length) {
      throw new Error('Changing the number of lines is not implemented')
    }

    this.lines = lines
    this.indexNameOffset = indexNameOffset
    this.minIndexRange = minIndexRangeLength
    this.maxIndexRange = maxIndexRangeLength

    // Adjust the selected map range for the new lines
    const indexRange = this.getIndexRange(lines)
    const { start, end } =
      indexRangeLength !== undefined
        ? getInitialIndexRange(
            indexRange.min,
            indexRange.max,
            inRange(minIndexRangeLength, indexRangeLength, maxIndexRangeLength),
          )
        : fitRangeInRangeWhileKeepingLength(
            indexRange.min,
            indexRange.max,
            this.startIndex,
            inRange(this.startIndex + this.minIndexRange, this.endIndex, this.startIndex + this.maxIndexRange),
          )
    this.startIndex = start
    this.endIndex = end
  }

  private setDomState() {
    this.mainCanvasWidth = this.mainCanvas.clientWidth
    this.mainCanvasHeight = this.mainCanvas.clientHeight
    this.mapCanvasWidth = this.mapCanvas.clientWidth
    this.mapCanvasHeight = this.mapCanvas.clientHeight
    this.pixelRatio = devicePixelRatio || 1
  }

  private getStateForGestureWatcher(): ChartGestureState {
    const indexRange = this.getIndexRange(this.lines)
    return {
      mapSelectorStart: (this.startIndex - indexRange.min) / (indexRange.max - indexRange.min || 1),
      mapSelectorEnd: (this.endIndex - indexRange.min) / (indexRange.max - indexRange.min || 1),
    }
  }

  private handleResize = () => {
    this.setDomState()
    this.handleStateChange()
  }

  private handleStartIndexMove(relativeX: number) {
    const indexRange = this.getIndexRange(this.lines)
    const index = indexRange.min + relativeX * (indexRange.max - indexRange.min)
    this.startIndex = inRange(indexRange.min, index, indexRange.max - this.minIndexRange)
    this.endIndex = inRange(this.startIndex + this.minIndexRange, this.endIndex, this.startIndex + this.maxIndexRange)
    this.handleStateChange()
  }

  private handleEndIndexMove(relativeX: number) {
    const indexRange = this.getIndexRange(this.lines)
    const index = indexRange.min + relativeX * (indexRange.max - indexRange.min)
    this.endIndex = inRange(indexRange.min + this.minIndexRange, index, indexRange.max)
    this.startIndex = inRange(this.endIndex - this.maxIndexRange, this.startIndex, this.endIndex - this.minIndexRange)
    this.handleStateChange()
  }

  private handleIndexMove(relativeMiddleX: number) {
    const indexRange = this.getIndexRange(this.lines)
    const index = indexRange.min + relativeMiddleX * (indexRange.max - indexRange.min)
    const currentIndexLength = this.endIndex - this.startIndex
    this.startIndex = inRange(indexRange.min, index - currentIndexLength / 2, indexRange.max - currentIndexLength)
    this.endIndex = this.startIndex + currentIndexLength
    this.handleStateChange()
  }

  private handleDetailsPositionMove(relativeX: number) {
    if (relativeX === null) {
      this.detailsIndex = null
    } else {
      const index = this.startIndex + (this.endIndex - this.startIndex) * relativeX
      this.detailsIndex = inRange(Math.ceil(this.startIndex), Math.round(index), Math.floor(this.endIndex))
    }
    this.handleStateChange(true)
  }

  /**
   * Must be called when a property that reflects the chart state changes.
   *
   * Toggle `dontForceRender` when you change a state that never requires rendering without running animations.
   */
  private handleStateChange(dontForceRender?: boolean) {
    this.animatedState.moveTo(this.getAnimatedStateTarget())
    if (!dontForceRender) {
      this.animatedState.updateOnNextFrame()
    }
    this.gesturesWatcher.setChartState(this.getStateForGestureWatcher())
  }

  /**
   * Returns the state to which the animations should be going
   */
  private getAnimatedStateTarget() {
    const detailsPosition = getDetailsPosition(this.lines, this.detailsIndex, this.startIndex, this.endIndex)
    const target: AnimatedWriteState = {
      lineOpacities: this.getLineOpacities(this.lines),
      indexNotchScale: getIndexNotchScale(this.startIndex, this.endIndex, this.mainCanvasWidth),
      detailsPosition: [detailsPosition, detailsPosition ? 1 : 0],
    }

    const mapValueRange = this.getMapValueRange(
      this.lines,
      this.options.maxBottomValue,
      this.options.minTopValue,
      this.getLinesMinAndMax(this.lines),
    )
    if (mapValueRange) {
      target.mapValueMiddle = mapValueRange.middle

      // Don't shrink the chart when all the lines are disabled or equal
      if (mapValueRange.size) {
        target.mapValueSize = mapValueRange.size
      }
    }

    const mainValueRange = this.getMainValueRange(
      this.lines,
      this.startIndex,
      this.endIndex,
      this.options.maxBottomValue,
      this.options.minTopValue,
    )
    if (mainValueRange) {
      target.mainValueMiddle = mainValueRange.middle

      // Don't shrink the chart when all the lines are disabled or equal
      if (mainValueRange.size) {
        target.mainValueSize = mainValueRange.size
        target.mainValueNotchScale = mainValueRange.notchScale
      }
    }

    return target
  }

  /**
   * Renders a chart animation frame
   */
  private render() {
    const {
      lineOpacities,
      mapValueMiddle,
      mapValueSize,
      mainValueMiddle,
      mainValueSize,
      detailsPosition: [
        { index: detailsIndex, align: detailsAlign, lineOpacities: detailsLineOpacities },
        detailsOpacity,
      ],
      ...restAnimatedState
    } = this.animatedState.getState()

    const { min: minIndex, max: maxIndex } = this.getIndexRange(this.lines)

    this.updateCanvases(
      {
        ...restAnimatedState,
        linesData: this.lines,
        indexNameOffset: this.indexNameOffset,
        mainCanvasWidth: this.mainCanvasWidth * this.pixelRatio,
        mainCanvasHeight: this.mainCanvasHeight * this.pixelRatio,
        mapCanvasWidth: this.mapCanvasWidth * this.pixelRatio,
        mapCanvasHeight: this.mapCanvasHeight * this.pixelRatio,
        pixelRatio: this.pixelRatio,
        minIndex,
        maxIndex,
        startIndex: this.startIndex,
        endIndex: this.endIndex,
        mapMinValue: mapValueMiddle - mapValueSize / 2,
        mapMaxValue: mapValueMiddle + mapValueSize / 2,
        mainMinValue: mainValueMiddle - mainValueSize / 2,
        mainMaxValue: mainValueMiddle + mainValueSize / 2,
        detailsIndex,
        detailsAlign,
        detailsOpacity,
        detailsPopupWidth: this.options.detailsPopupWidth,
        detailsPopupValuePrecision: this.options.detailsPopupValuePrecision,
      },
      Object.values(lineOpacities),
      Object.values(detailsLineOpacities),
    )
  }
}

function getIndexRange(lines: LinesList) {
  return {
    min: 0,
    max: Math.max(2, ...lines.map(({ values }) => values.length)) - 1,
  }
}

function makeGetLinesMinAndMax() {
  // Cache
  let lastLines: LinesList = []
  let lastMinAndMax: LinesMinAndMax = []

  return function getLinesMinAndMax(lines: LinesList): LinesMinAndMax {
    if (lines === lastLines) {
      return lastMinAndMax
    }

    const minAndMax: Array<{ min: number; max: number }> = []

    for (let key = 0; key < lines.length; ++key) {
      minAndMax.push(
        key < lastLines.length && lastLines[key].values === lines[key].values
          ? lastMinAndMax[key]
          : getArrayMinAndMax(lines[key].values),
      )
    }

    lastLines = lines
    lastMinAndMax = minAndMax
    return minAndMax
  }
}

function getInitialIndexRange(minIndex: number, maxIndex: number, length: number): { start: number; end: number } {
  return {
    start: minIndex,
    end: Math.min(minIndex + length, maxIndex),
  }
}

function getLineOpacities(lines: LinesList) {
  const opacities: Record<number, number> = {}
  for (let key = 0; key < lines.length; ++key) {
    opacities[key] = lines[key].draw ? 1 : 0
  }
  return opacities
}

function getMapValueRange(lines: LinesList, maxBottom: number, minTop: number, linesMinAndMaxCache: LinesMinAndMax) {
  let min = maxBottom
  let max = minTop

  for (let key = 0; key < lines.length; ++key) {
    if (lines[key].draw) {
      if (linesMinAndMaxCache[key].min < min) {
        min = linesMinAndMaxCache[key].min
      }
      if (linesMinAndMaxCache[key].max > max) {
        max = linesMinAndMaxCache[key].max
      }
    }
  }

  if (isFinite(min) && isFinite(max)) {
    return {
      middle: (min + max) / 2,
      size: max - min,
    }
  }

  return undefined
}

function getMainValueRange(lines: LinesList, startIndex: number, endIndex: number, maxBottom: number, minTop: number) {
  let totalMin = maxBottom
  let totalMax = minTop

  for (let key = 0; key < lines.length; ++key) {
    if (lines[key].draw) {
      const { min, max } = getMinAndMaxOnRange(lines[key].values, startIndex, endIndex)
      if (min < totalMin) {
        totalMin = min
      }
      if (max > totalMax) {
        totalMax = max
      }
    }
  }

  if (isFinite(totalMin) && isFinite(totalMax)) {
    const { min, max, notchScale } = getValueRangeForFixedBottom(totalMin, totalMax, chartValueScaleMaxNotchCount)
    return {
      middle: (min + max) / 2,
      size: max - min,
      notchScale,
    }
  }

  return undefined
}

function getIndexNotchScale(startIndex: number, endIndex: number, canvasWidth: number) {
  return Math.max(
    getSubDecimalScale(1), // The minimal distance between the notches is 1
    getScaleToFitRange(endIndex - startIndex, (canvasWidth - chartSidePadding * 2) / chartValueScaleMinSpaceForNotch),
  )
}

function getDetailsPosition(lines: LinesList, detailsX: number | null, startIndex: number, endIndex: number) {
  if (detailsX === null) {
    return undefined
  }

  const relativePosition = (detailsX - startIndex) / (endIndex - startIndex)

  const opacities: Record<number, number> = {}
  for (let key = 0; key < lines.length; ++key) {
    opacities[key] = lines[key].showInPopup ? 1 : 0
  }

  return {
    index: detailsX,
    align: relativePosition > 0.5 ? 0 : 1,
    lineOpacities: opacities,
  }
}

/**
 * Creates an animation state container with the default state
 */
function createAnimatedState(linesCount: number, render: () => void) {
  const lineOpacitiesTransitions: Record<number, Animation<number>> = {}
  const detailsLineOpacitiesTransitions: Record<number, Animation<number>> = {}
  for (let key = 0; key < linesCount; ++key) {
    lineOpacitiesTransitions[key] = makeTransition(1, { easing: easeQuadInOut })
    detailsLineOpacitiesTransitions[key] = makeTransition(1, { easing: easeQuadInOut })
  }

  const defaultValueMiddle = 0
  const defaultValueSize = 2
  const defaultMainYRange = getValueRangeForFixedBottom(
    defaultValueMiddle - defaultValueSize / 2,
    defaultValueMiddle + defaultValueSize / 2,
    chartValueScaleMaxNotchCount,
  )

  return makeAnimationGroup(
    {
      lineOpacities: makeTransitionGroup(lineOpacitiesTransitions),
      mapValueMiddle: makeTransition(defaultValueMiddle),
      mapValueSize: makeExponentialTransition(defaultValueSize),
      mainValueMiddle: makeTransition((defaultMainYRange.min + defaultMainYRange.max) / 2),
      mainValueSize: makeExponentialTransition(defaultMainYRange.max - defaultMainYRange.min),
      mainValueNotchScale: makeTransition(defaultMainYRange.notchScale),
      indexNotchScale: makeTransition(0),
      detailsPosition: makeInstantWhenHiddenTransition(
        makeTransitionGroup({
          index: makeTransition(0, { duration: 300 }),
          align: makeTransition(0, { easing: easeQuadInOut }),
          lineOpacities: makeTransitionGroup(detailsLineOpacitiesTransitions),
        }),
        makeTransition(0, { easing: easeQuadInOut, duration: 300 }),
      ),
    },
    render,
  )
}
