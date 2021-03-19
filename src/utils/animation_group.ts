/* eslint-disable @typescript-eslint/no-explicit-any */
import { easeCubicOut } from 'd3-ease'

/**
 * A passive animation for an animation group
 */
export interface Animation<T, U = T> {
  /** Returns the current animation state */
  getState(): T
  /** Returns true if the animation has stopped and doesn't need a frame to update */
  isFinished(): boolean
  /** Sets the new animation target. Animation may start again when this method is called. */
  moveTo(target: U, instantly?: boolean): void
}

type AnimationReadState<T extends Animation<any>> = T extends Animation<infer A, any> ? A : never
type AnimationWriteState<T extends Animation<any>> = T extends Animation<any, infer A> ? A : never

export interface AnimationGroup<T extends Record<keyof any, Animation<any>>> {
  /**
   * Sets the animations targets. The motion happens after calling this.
   *
   * @param targets The keys are the animation ids. May contain not all the animations.
   * @param isInitial Set to true to change the state immediately and don't trigger the callback
   */
  moveTo(targets: { [K in keyof T]?: AnimationWriteState<T[K]> }, isInitial?: boolean): void

  /** Returns the current animations states. The keys are the animation ids. */
  getState(): { [K in keyof T]: AnimationReadState<T[K]> }

  /** Cancels the animations */
  destroy(): void

  /** Calls the update callback on the next browser animation frame */
  updateOnNextFrame(): void
}

/**
 * Allows to have multiple animations with a single callback call on every animation frame
 *
 * @param animations The groups animations. The keys are the animation ids.
 * @param onUpdate A function to call when an animation state changes. Use it to apply the animations state to a target.
 */
export function makeAnimationGroup<T extends Record<keyof any, Animation<any>>>(
  animations: T,
  onUpdate: () => void,
): AnimationGroup<T> {
  let animationFrameId = -1
  const animationGroup = makeTransitionGroup(animations)

  function updateOnNextFrame() {
    if (animationFrameId === -1) {
      animationFrameId = requestAnimationFrame(handleAnimationFrame)
    }
  }

  function handleAnimationFrame() {
    animationFrameId = -1

    if (!animationGroup.isFinished()) {
      updateOnNextFrame()
    }

    onUpdate()
  }

  return {
    moveTo(targets, isInitial) {
      animationGroup.moveTo(targets, isInitial)
      if (!isInitial && animationFrameId === -1 && !animationGroup.isFinished()) {
        updateOnNextFrame()
      }
    },

    getState() {
      return animationGroup.getState()
    },

    destroy() {
      if (animationFrameId !== -1) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = -1
      }
    },

    updateOnNextFrame,
  }
}

interface TransitionOptions {
  duration?: number
  easing?: (progress: number) => number
  maxDistance?: number
}

/**
 * A simple transition from one value to another
 */
export function makeTransition(
  initialValue = 0,
  { duration = 400, easing = easeCubicOut, maxDistance = Infinity }: TransitionOptions = {},
): Animation<number> {
  let startValue = initialValue
  let startTime = Date.now()
  let targetValue = initialValue
  let finished = true

  function getState() {
    const stage = Math.min(1, (Date.now() - startTime) / duration)

    if (stage >= 1) {
      finished = true
    }

    return startValue + (targetValue - startValue) * easing(stage)
  }

  function isFinished() {
    return finished
  }

  function moveTo(value: number, instantly?: boolean) {
    if (value === targetValue) {
      return
    }

    startValue = instantly ? value : getState()
    startTime = Date.now()
    targetValue = value
    finished = false

    if (startValue < targetValue) {
      startValue = Math.max(startValue, targetValue - maxDistance)
    } else {
      startValue = Math.min(startValue, targetValue + maxDistance)
    }
  }

  return { getState, isFinished, moveTo }
}

/**
 * Groups multiple transition so that they can be controlled as one transition
 *
 * @param {Record<string, AnimationGroup~Animation>} transitions
 * @returns AnimationGroup~Animation
 */
export function makeTransitionGroup<T extends Record<keyof any, Animation<any>>>(
  transitions: T,
): Animation<{ [K in keyof T]: AnimationReadState<T[K]> }, { [K in keyof T]?: AnimationWriteState<T[K]> }> {
  const transitionKeys = Object.keys(transitions) as Array<keyof T>

  return {
    getState() {
      const state = {} as { [K in keyof T]: AnimationReadState<T[K]> }

      for (let i = 0; i < transitionKeys.length; ++i) {
        state[transitionKeys[i]] = transitions[transitionKeys[i]].getState()
      }

      return state
    },

    isFinished() {
      for (let i = 0; i < transitionKeys.length; ++i) {
        if (!transitions[transitionKeys[i]].isFinished()) {
          return false
        }
      }

      return true
    },

    moveTo(targets, instantly) {
      for (const key in targets) {
        if (Object.prototype.hasOwnProperty.call(transitions, key)) {
          transitions[key].moveTo(targets[key], instantly)
        }
      }
    },
  }
}

/**
 * Handles two transitions: makes the first instant when the opacity is 0. Suitable for something that should move
 * instantly while invisible.
 */
export function makeInstantWhenHiddenTransition<T, U>(
  valueTransition: Animation<T, U>,
  opacityTransition: Animation<number>,
): Animation<[T, number], [U | undefined, number]> {
  return {
    getState() {
      return [valueTransition.getState(), opacityTransition.getState()]
    },

    isFinished() {
      return valueTransition.isFinished() && opacityTransition.isFinished()
    },

    moveTo([value, opacity], instantly) {
      if (value !== undefined) {
        valueTransition.moveTo(value, instantly || opacityTransition.getState() <= 0)
      }
      opacityTransition.moveTo(opacity, instantly)
    },
  }
}

interface ExponentialTransitionOption extends TransitionOptions {
  minValue?: number
}

/**
 * Animates the number power transitions. A great choice for a zoom transition.
 */
export function makeExponentialTransition(
  initialValue = 0,
  { minValue = 1e-12, ...options }: ExponentialTransitionOption = {},
): Animation<number> {
  function plainValueToPower(value: number) {
    return Math.log(Math.max(value, minValue))
  }

  function powerToPlainValue(power: number) {
    return Math.exp(power)
  }

  const powerTransition = makeTransition(plainValueToPower(initialValue), options)

  return {
    getState() {
      return powerToPlainValue(powerTransition.getState())
    },
    isFinished: powerTransition.isFinished,
    moveTo(value, instantly) {
      powerTransition.moveTo(plainValueToPower(value), instantly)
    },
  }
}

/**
 * Animates the number logarithm transition. Designed for transition of the scale of an axis with a linear value
 * transition. Does opposite to `makeExponentialTransition`.
 */
export function makeLogarithmicTransition(initialValue = 0, options?: TransitionOptions): Animation<number> {
  function getPoweredValue(value: number) {
    return Math.exp(value)
  }

  function getOriginalValue(poweredValue: number) {
    return Math.log(Math.max(poweredValue))
  }

  const valueTransition = makeTransition(getPoweredValue(initialValue), options)

  return {
    getState() {
      return getOriginalValue(valueTransition.getState())
    },
    isFinished: valueTransition.isFinished,
    moveTo(value, instantly) {
      valueTransition.moveTo(getPoweredValue(value), instantly)
    },
  }
}
