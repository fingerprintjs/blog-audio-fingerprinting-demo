// eslint-disable-next-line @typescript-eslint/no-var-requires
const shallowEqual = require('shallowequal')
import * as React from 'react'
import { isDesktopSafari, isWebKit, isWebKit606OrNewer } from './browser'

export interface OscillatorOptions {
  type: OscillatorType
  frequency: number
}

export interface DynamicsCompressorOptions {
  threshold: number
  knee: number
  ratio: number
  attack: number
  release: number
}

export interface Options {
  /** Number of samples (signal values) to render */
  length: number
  oscillator: OscillatorOptions
  /** Omit the property to disable the dynamics compressor */
  dynamicsCompressor?: DynamicsCompressorOptions
}

/**
 * Renders an audio signal.
 * Undefined is returned when the signal can't be rendered and there is no error.
 *
 * Based on https://github.com/fingerprintjs/fingerprintjs/blob/3201a7d61bb4df2816c226d8364cc98bb4235e59/src/sources/audio.ts
 */
export async function getAudioSignal(options: Options): Promise<Float32Array | undefined> {
  const w = window
  const AudioContext = w.OfflineAudioContext || w.webkitOfflineAudioContext
  if (!AudioContext) {
    return undefined
  }

  // In some browsers, audio context always stays suspended unless the context is started in response to a user action
  // (e.g. a click or a tap). It prevents audio signal from being rendered at an arbitrary moment of time.
  if (doesCurrentBrowserSuspendAudioContext()) {
    return undefined
  }

  const context = new AudioContext(1, options.length, 44100)
  const nodes: AudioNode[] = []

  const oscillator = context.createOscillator()
  nodes.push(oscillator)
  oscillator.type = options.oscillator.type
  setAudioParam(context, oscillator.frequency, options.oscillator.frequency)

  if (options.dynamicsCompressor) {
    const compressor = context.createDynamicsCompressor()
    nodes.push(compressor)
    for (const trait of ['threshold', 'knee', 'ratio', 'attack', 'release'] as const) {
      setAudioParam(context, compressor[trait], options.dynamicsCompressor[trait])
    }
  }

  // Connect the nodes sequentially
  for (let i = 0; i < nodes.length; ++i) {
    nodes[i].connect(nodes[i + 1] ?? context.destination)
  }
  oscillator.start(0)

  try {
    const buffer = await renderAudio(context)
    return buffer.getChannelData(0)
  } finally {
    for (const node of nodes) {
      node.disconnect()
    }
  }
}

/**
 * Checks if the current browser is known to always suspend audio context
 */
function doesCurrentBrowserSuspendAudioContext() {
  return isWebKit() && !isDesktopSafari() && !isWebKit606OrNewer()
}

function setAudioParam(context: BaseAudioContext, param: unknown, value: number) {
  const isAudioParam = (value: unknown): value is AudioParam =>
    !!value && typeof (value as AudioParam).setValueAtTime === 'function'

  if (isAudioParam(param)) {
    param.setValueAtTime(value, context.currentTime)
  }
}

function renderAudio(context: OfflineAudioContext) {
  return new Promise<AudioBuffer>((resolve, reject) => {
    context.oncomplete = (event) => resolve(event.renderedBuffer)

    const tryResume = () => {
      try {
        context.startRendering()
      } catch (error) {
        reject(error)
        return
      }

      // Sometimes the audio context doesn't start after calling `startRendering` (in addition to the cases where
      // audio context doesn't start at all). A known case is starting an audio context when the browser tab is in
      // background on iPhone. Retries usually help in this case.
      if (context.state === 'suspended') {
        setTimeout(tryResume, 300)
      }
    }

    tryResume()
  })
}

/**
 * Renders audio signals sequentially.
 *
 * Null means that the signal is impossible to get.
 * Undefined means that the no signal has been calculated yet.
 */
export function useAudioSignal(options: Options): Float32Array | null | undefined {
  const [signal, setSignal] = React.useState<Float32Array | null>()
  const queueRef = React.useRef<ReturnType<typeof makeRenderingQueue>>()

  React.useEffect(() => {
    queueRef.current = makeRenderingQueue((signal) => setSignal(signal || null))
    return queueRef.current.stop
  }, [])

  React.useEffect(() => {
    queueRef.current?.setOptions(options)
  }, [options])

  return signal
}

export function areOptionsEqual(options1: Options, options2: Options): boolean {
  for (const property of ['length', 'oscillator', 'dynamicsCompressor'] as const) {
    if (!shallowEqual(options1[property], options2[property])) {
      return false
    }
  }
  return true
}

/**
 * Helps getting 1 audio signal at a time.
 */
function makeRenderingQueue(onSignalReady: (signal: Float32Array | undefined) => unknown) {
  let isRendering = false
  let isStopped = false
  let lastRequestedOptions: Options | undefined
  let lastCompletedOptions: Options | undefined

  const setOptions = async (options: Options) => {
    lastRequestedOptions = options

    if (isRendering || isStopped) {
      return
    }

    try {
      isRendering = true

      while (!(lastCompletedOptions && areOptionsEqual(lastRequestedOptions, lastCompletedOptions))) {
        // Save the options so that they are the same after completing the rendering
        const currentOptions = lastRequestedOptions
        let signal: Float32Array | undefined

        try {
          signal = await getAudioSignal(currentOptions)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error)
        }

        lastCompletedOptions = currentOptions
        if (isStopped) {
          break
        } else {
          onSignalReady(signal)
        }
      }
    } finally {
      isRendering = false
    }
  }

  const stop = () => {
    isStopped = true
  }

  return { setOptions, stop }
}
