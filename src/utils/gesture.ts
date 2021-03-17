import { isInCircle } from './geometry'

type MouseEventHandler = (event: MouseEvent) => unknown
type TouchEventHandler = (touch: Touch) => unknown
type MouseOrTouchEventHandler = (event: MouseEvent | Touch) => unknown
type Coordinates = [x: number, y: number]

const { addEventListener, removeEventListener, setTimeout, clearTimeout } = window

/**
 * Triggers the move callback until the mouse drag is finished. Create in a mousedown event handler.
 */
export function watchMouseDrag({
  onMove,
  onEnd,
}: {
  onMove: MouseEventHandler
  onEnd: MouseEventHandler
}): { destroy(): void } {
  const handleMove = (event: MouseEvent) => {
    onMove(event)
  }

  const handleEnd = (event: MouseEvent) => {
    destroy()
    onEnd(event)
  }

  addEventListener('mousemove', handleMove)
  addEventListener('mouseup', handleEnd)
  addEventListener('mouseleave', handleEnd)

  const destroy = () => {
    removeEventListener('mousemove', handleMove)
    removeEventListener('mouseup', handleEnd)
    removeEventListener('mouseleave', handleEnd)
  }

  return { destroy }
}

/**
 * Triggers the move callback until the touch move is finished. Create in a touchstart event handler.
 */
export function watchTouchDrag({
  startTouch,
  eventTarget = window,
  onMove,
  onEnd,
}: {
  startTouch: Touch
  eventTarget?: GlobalEventHandlers
  onMove: TouchEventHandler
  onEnd: TouchEventHandler
}): { destroy(): void } {
  const getTouch = (event: TouchEvent) => {
    for (let i = 0; i < event.changedTouches.length; ++i) {
      const touch = event.changedTouches[i]
      if (touch.identifier === startTouch.identifier) {
        return touch
      }
    }

    return null
  }

  const handleMove = (event: TouchEvent) => {
    const touch = getTouch(event)
    if (touch) {
      onMove(touch)
    }
  }

  const handleEnd = (event: TouchEvent) => {
    const touch = getTouch(event)
    if (touch) {
      destroy()
      onEnd(touch)
    }
  }

  eventTarget.addEventListener('touchmove', handleMove)
  eventTarget.addEventListener('touchend', handleEnd)
  eventTarget.addEventListener('touchcancel', handleEnd)

  const destroy = () => {
    eventTarget.removeEventListener('touchmove', handleMove)
    eventTarget.removeEventListener('touchend', handleEnd)
    eventTarget.removeEventListener('touchcancel', handleEnd)
  }

  return { destroy }
}

export function watchHover({
  element,
  onMove,
  onEnd,
  checkHover = () => true,
}: {
  element: GlobalEventHandlers
  onMove: MouseOrTouchEventHandler
  onEnd: MouseOrTouchEventHandler
  checkHover?: (event: MouseEvent | Touch) => boolean
}): { destroy(): void } {
  let hoverId: string | undefined

  const handleMove = (event: Event) => {
    eachSubEvent(event, (id, subEvent) => {
      if (hoverId === undefined || id === hoverId) {
        if (checkHover(subEvent)) {
          hoverId = id
          onMove(subEvent)
        } else if (hoverId !== undefined) {
          hoverId = undefined
          onEnd(subEvent)
        }
      }
    })
  }

  const handleEnd = (event: Event) => {
    eachSubEvent(event, (id, subEvent) => {
      if (hoverId === id) {
        event.preventDefault() // To prevent the frozen hover on touch devices
        hoverId = undefined
        onEnd(subEvent)
      }
    })
  }

  const moveEvents = ['mouseenter', 'mousemove', 'touchstart', 'touchmove'] as const
  const endEvents = ['mouseleave', 'touchend', 'touchcancel'] as const

  for (const name of moveEvents) {
    element.addEventListener(name, handleMove)
  }
  for (const name of endEvents) {
    element.addEventListener(name, handleEnd)
  }

  return {
    destroy() {
      for (const name of moveEvents) {
        element.removeEventListener(name, handleMove)
      }
      for (const name of endEvents) {
        element.removeEventListener(name, handleEnd)
      }
    },
  }
}

export function watchLongTap(
  element: GlobalEventHandlers,
  onShortTap: () => unknown,
  onLongTap: () => unknown,
  longTapTime = 500,
  maxTapDistance = 10,
): { destroy(): void } {
  let tapId: string | undefined
  let tapStartCoordinates: Coordinates | undefined
  let timeoutId: number | undefined

  const permanentEventHandlers = {
    mousedown: handleTapStart,
    touchstart: handleTapStart,
    touchmove: handleTapMove,
    touchend: handleTapEnd,
    touchcancel: handleTapEnd,
    contextmenu: preventDefault, // To prevent the context menu on a long touch
  }

  for (const event of Object.keys(permanentEventHandlers) as Array<keyof typeof permanentEventHandlers>) {
    element.addEventListener(event, permanentEventHandlers[event])
  }

  return {
    destroy() {
      clearAfterTap()
      for (const event of Object.keys(permanentEventHandlers) as Array<keyof typeof permanentEventHandlers>) {
        element.removeEventListener(event, permanentEventHandlers[event])
      }
    },
  }

  function handleTapStart(event: Event) {
    eachSubEvent(event, (id, subEvent) => {
      clearAfterTap()
      tapId = id
      tapStartCoordinates = getEventCoordinates(subEvent)
      timeoutId = setTimeout(handleTapTimeout, longTapTime)

      if (id === 'mouse') {
        event.preventDefault()
        addEventListener('mousemove', handleTapMove)
        addEventListener('mouseup', handleTapEnd)
      }
    })
  }

  function handleTapMove(event: Event) {
    eachSubEvent(event, (id, subEvent) => {
      if (id === tapId) {
        if (!isInTapDistance(getEventCoordinates(subEvent))) {
          clearAfterTap()
        }
      }
    })
  }

  function handleTapEnd(event: Event) {
    event.preventDefault() // To prevent excess artificial mouse events after releasing the element

    eachSubEvent(event, (id) => {
      if (id === tapId) {
        clearAfterTap()
        onShortTap()
      }
    })
  }

  function handleTapTimeout() {
    clearAfterTap()
    onLongTap()
  }

  function clearAfterTap() {
    if (tapId === 'mouse') {
      removeEventListener('mousemove', handleTapMove)
      removeEventListener('mouseup', handleTapEnd)
    }
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    tapId = undefined
    tapStartCoordinates = undefined
  }

  function isInTapDistance(coordinates: Coordinates) {
    if (!tapStartCoordinates) {
      return false
    }

    return isInCircle(coordinates[0], coordinates[1], tapStartCoordinates[0], tapStartCoordinates[1], maxTapDistance)
  }

  function getEventCoordinates(event: MouseEvent | Touch): Coordinates {
    return [event.clientX, event.clientY]
  }
}

function eachSubEvent(event: Event, callback: (type: string, event: MouseEvent | Touch) => unknown) {
  if (event.type.startsWith('mouse')) {
    callback('mouse', event as MouseEvent)
  } else if (event.type.startsWith('touch')) {
    const touches = (event as TouchEvent).changedTouches
    for (let i = 0; i < touches.length; ++i) {
      callback(`touch${touches[i].identifier}`, touches[i])
    }
  }
}

function preventDefault(event: Event) {
  event.preventDefault()
}
