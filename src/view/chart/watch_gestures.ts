import {
  chartMainTopMargin,
  chartMapHeight,
  chartSidePadding,
  chartMainLinesTopMargin,
  chartMainLinesBottomMargin,
  chartMapBottom,
} from '../style'
import { watchMouseDrag, watchTouchDrag, watchHover } from '../../utils/gesture'
import { isInRectangle } from '../../utils/geometry'

const mapGripOutsideOffset = 30
const mapGripInsideOffset = 0
const mapGripVerticalOffset = 10
const mapLinesSideOffset = 10

export interface ChartGestureState {
  // In absolute units (from 0 to 1)
  mapSelectorStart: number
  mapSelectorEnd: number
}

export interface GestureWatcher {
  setChartState(state: Readonly<ChartGestureState>): void
  destroy(): void
}

export interface GestureCallbacks {
  mapSelectorStart(relativeX: number): unknown
  mapSelectorMiddle(relativeX: number): unknown
  mapSelectorEnd(relativeX: number): unknown
  detailsPosition(relativeX: number | null): unknown
}

interface Watcher {
  destroy(): unknown
}

type WatcherCreator = (options: {
  onMove(event: MouseEvent | Touch): unknown
  onEnd(event: MouseEvent | Touch): unknown
}) => Watcher

/**
 * Watches for different gestures on the chart (drag the map, hover the lines, etc.)
 */
export default function watchGestures(
  element: HTMLElement,
  chartState: Readonly<ChartGestureState>,
  callbacks: GestureCallbacks,
): GestureWatcher {
  let startMapSelectorDrag: Watcher | undefined
  let middleMapSelectorDrag: Watcher | undefined
  let endMapSelectorDrag: Watcher | undefined

  element.addEventListener('mousedown', handleMouseDown)
  element.addEventListener('touchstart', handleTouchStart, { passive: false })

  const detailsHoverWatcher = watchHover({
    element,
    checkHover: (event) => {
      const { x, y } = getEventRelativeCoordinates(event)
      return isInMapLines(x, y)
    },
    onMove: (event) => {
      const { x } = getEventRelativeCoordinates(event)
      const { x: linesX, width: linesWidth } = getMainLinesBounds()
      callbacks.detailsPosition((x - linesX) / (linesWidth || 1))
    },
    onEnd: () => callbacks.detailsPosition(null),
  })

  return {
    setChartState(newState) {
      chartState = newState
    },
    destroy() {
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('touchstart', handleTouchStart)

      for (const watcher of [detailsHoverWatcher, startMapSelectorDrag, middleMapSelectorDrag, endMapSelectorDrag]) {
        watcher?.destroy()
      }
    },
  }

  function handleMouseDown(event: MouseEvent) {
    // Don't call `event.preventDefault()` here: https://stackoverflow.com/q/66703382/1118709
    const { x, y } = getEventRelativeCoordinates(event)

    if (isInMapSelectionStart(x, y)) {
      handleMapStartDrag(x, watchMouseDrag)
    } else if (isInMapSelectionEnd(x, y)) {
      handleMapEndDrag(x, watchMouseDrag)
    } else if (isInMapSelectionMiddle(x, y)) {
      handleMapMiddleDrag(x, watchMouseDrag)
    }
  }

  function handleTouchStart(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; ++i) {
      const touch = event.changedTouches[i]
      const { x, y } = getEventRelativeCoordinates(touch)
      const createWatcher: WatcherCreator = (args) => {
        event.preventDefault()
        return watchTouchDrag({ startTouch: touch, ...args })
      }

      if (isInMapSelectionStart(x, y)) {
        handleMapStartDrag(x, createWatcher)
      } else if (isInMapSelectionEnd(x, y)) {
        handleMapEndDrag(x, createWatcher)
      } else if (isInMapSelectionMiddle(x, y)) {
        handleMapMiddleDrag(x, createWatcher)
      }
    }
  }

  /**
   * @param x The X position of the event start in px relative to the block
   * @param createWatcher
   */
  function handleMapStartDrag(x: number, createWatcher: WatcherCreator) {
    if (startMapSelectorDrag) {
      return
    }

    const { x: mapX, width: mapWidth } = getMapBounds()
    const xOffset = x - (mapX + chartState.mapSelectorStart * mapWidth)

    startMapSelectorDrag = createWatcher({
      onMove: (event) => {
        const { x } = getEventRelativeCoordinates(event)
        const { x: mapX, width: mapWidth } = getMapBounds()
        callbacks.mapSelectorStart((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => (startMapSelectorDrag = undefined),
    })
  }

  /**
   * @param x The X position of the event start in px relative to the block
   * @param createWatcher
   */
  function handleMapMiddleDrag(x: number, createWatcher: WatcherCreator) {
    if (middleMapSelectorDrag) {
      return
    }

    const { x: mapX, width: mapWidth } = getMapBounds()
    const xOffset = x - (mapX + ((chartState.mapSelectorStart + chartState.mapSelectorEnd) / 2) * mapWidth)

    middleMapSelectorDrag = createWatcher({
      onMove: (event) => {
        const { x } = getEventRelativeCoordinates(event)
        const { x: mapX, width: mapWidth } = getMapBounds()
        callbacks.mapSelectorMiddle((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => (middleMapSelectorDrag = undefined),
    })
  }

  /**
   * @param x The X position of the event start in px relative to the block
   * @param createWatcher
   */
  function handleMapEndDrag(x: number, createWatcher: WatcherCreator) {
    if (endMapSelectorDrag) {
      return
    }

    const { x: mapX, width: mapWidth } = getMapBounds()
    const xOffset = x - (mapX + chartState.mapSelectorEnd * mapWidth)

    endMapSelectorDrag = createWatcher({
      onMove: (event) => {
        const { x } = getEventRelativeCoordinates(event)
        const { x: mapX, width: mapWidth } = getMapBounds()
        callbacks.mapSelectorEnd((x - xOffset - mapX) / (mapWidth || 1))
      },
      onEnd: () => (endMapSelectorDrag = undefined),
    })
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionStart(targetX: number, targetY: number) {
    const { x, y, width, height } = getMapBounds()

    return isInRectangle(
      targetX,
      targetY,
      x + width * chartState.mapSelectorStart - mapGripOutsideOffset,
      y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset,
      height + mapGripVerticalOffset * 2,
    )
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionEnd(targetX: number, targetY: number) {
    const { x, y, width, height } = getMapBounds()

    return isInRectangle(
      targetX,
      targetY,
      x + width * chartState.mapSelectorEnd - mapGripInsideOffset,
      y - mapGripVerticalOffset,
      mapGripInsideOffset + mapGripOutsideOffset,
      height + mapGripVerticalOffset * 2,
    )
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapSelectionMiddle(targetX: number, targetY: number) {
    const { x, y, width, height } = getMapBounds()

    return isInRectangle(
      targetX,
      targetY,
      x + width * chartState.mapSelectorStart,
      y - mapGripVerticalOffset,
      width * (chartState.mapSelectorEnd - chartState.mapSelectorStart),
      height + mapGripVerticalOffset * 2,
    )
  }

  /**
   * The coordinates are in pixels and relative to the block
   */
  function isInMapLines(targetX: number, targetY: number) {
    const { x, y, width, height } = getMainLinesBounds()

    return isInRectangle(targetX, targetY, x - mapLinesSideOffset, y, width + mapLinesSideOffset * 2, height)
  }

  function getEventRelativeCoordinates(event: MouseEvent | Touch) {
    const { clientWidth, clientHeight } = element
    const bounds = element.getBoundingClientRect()

    return {
      x: ((event.clientX - bounds.left) / bounds.width) * clientWidth,
      y: ((event.clientY - bounds.top) / bounds.height) * clientHeight,
    }
  }

  function getMapBounds() {
    const { clientWidth, clientHeight } = element

    return {
      x: chartSidePadding,
      y: clientHeight - chartMapHeight - chartMapBottom,
      width: clientWidth - chartSidePadding * 2,
      height: chartMapHeight,
    }
  }

  function getMainLinesBounds() {
    const { clientWidth, clientHeight } = element
    const y = chartMainTopMargin + chartMainLinesTopMargin

    return {
      x: chartSidePadding,
      y,
      width: clientWidth - chartSidePadding * 2,
      height: clientHeight - y - chartMainLinesBottomMargin - chartMapHeight,
    }
  }
}
