import { countTruthy } from './data'

/**
 * Checks whether the browser is based on mobile or desktop Safari without using user-agent.
 * All iOS browsers use WebKit (the Safari engine).
 */
export function isWebKit(): boolean {
  // Based on research in September 2020
  const w = window
  const n = navigator

  return (
    countTruthy([
      'ApplePayError' in w,
      'CSSPrimitiveValue' in w,
      'Counter' in w,
      n.vendor.indexOf('Apple') === 0,
      'getStorageUpdates' in n,
      'WebKitMediaKeys' in w,
    ]) >= 4
  )
}

/**
 * Checks whether the WebKit browser is a desktop Safari.
 */
export function isDesktopSafari(): boolean {
  const w = window

  return (
    countTruthy([
      'safari' in w, // Always false in Karma and BrowserStack Automate
      !('DeviceMotionEvent' in w),
      !('ongestureend' in w),
      !('standalone' in navigator),
    ]) >= 3
  )
}

/**
 * Checks whether the browser is based on WebKit version ≥606 (Safari ≥12) without using user-agent.
 * It doesn't check that the browser is based on WebKit, there is a separate function for this.
 *
 * @link https://en.wikipedia.org/wiki/Safari_version_history#Release_history Safari-WebKit versions map
 */
export function isWebKit606OrNewer(): boolean {
  // Checked in Safari 9–14
  const w = window

  return (
    countTruthy([
      'DOMRectList' in w,
      'RTCPeerConnectionIceEvent' in w,
      'SVGGeometryElement' in w,
      'ontransitioncancel' in w,
    ]) >= 3
  )
}
