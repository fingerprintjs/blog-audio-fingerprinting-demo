import * as React from 'react'
import { numberColorToRGBA } from '../utils/color'
import type { Signal } from '../example_signals'
import { getAudioSignal } from '../utils/audio'
import LoadingScreen from './loading_screen/loading_screen'
import Layout from './layout/layout'
import ToggleButtonGroup from './toggle_button/toggle_button_group'
import Chart from './chart/chart'
import { palette } from './style'

/**
 * The demo that shows differences between audio signals on different platforms
 */
const DifferenceDemo = React.memo(function DifferenceDemo() {
  const currentBrowserSignal = useCurrentBrowserSignal()
  const exampleSignals = useExampleSignals()

  if (currentBrowserSignal === undefined || exampleSignals === undefined) {
    return <LoadingScreen fullAbsolute />
  }

  return <LoadedDemo currentBrowserSignal={currentBrowserSignal} exampleSignals={exampleSignals} />
})

export default DifferenceDemo

/**
 * Null means that the signal is impossible to get.
 * Undefined means that the signal is being calculated.
 */
function useCurrentBrowserSignal() {
  const [signal, setSignal] = React.useState<Float32Array | null>()

  React.useEffect(() => {
    getAudioSignal({
      // Matches the example signals (actually they contain signal slices from 4000 to 5000)
      length: 5000,
      // Match the parameters at https://github.com/fingerprintjs/fingerprintjs/blob/3201a7d61b/src/sources/audio.ts
      oscillator: {
        type: 'triangle',
        frequency: 10000,
      },
      dynamicsCompressor: {
        threshold: -50,
        knee: 40,
        ratio: 12,
        attack: 0,
        release: 0.25,
      },
    }).then(
      // Trim the signal to match the example signals
      (signal) => setSignal(signal?.subarray(4000) || null),
      (error) => {
        // eslint-disable-next-line no-console
        console.error(error)
        setSignal(null)
      },
    )
  }, [])

  return signal
}

function useExampleSignals() {
  const [exampleSignals, setExampleSignals] = React.useState<Record<string, Signal>>()

  React.useEffect(() => {
    import('../example_signals').then(({ default: signals }) => {
      setExampleSignals(signals)
    })
  }, [])

  return exampleSignals
}

interface LoadedDemoProps {
  currentBrowserSignal: Float32Array | null
  exampleSignals: Record<string, Signal>
}

function LoadedDemo({ currentBrowserSignal, exampleSignals }: LoadedDemoProps) {
  const currentSignalKey = '__current'
  const [enabledSignals, setEnabledSignals] = React.useState([currentSignalKey, ...Object.keys(exampleSignals)])

  const allSignals = React.useMemo(() => {
    const signals = Object.entries(exampleSignals).map(([key, { title, values }]) => ({
      key,
      title,
      color: 0,
      values,
    }))

    if (currentBrowserSignal) {
      signals.unshift({
        key: currentSignalKey,
        title: 'This browser',
        color: 0,
        values: currentBrowserSignal,
      })
    }

    for (let i = 0; i < signals.length; ++i) {
      signals[i].color = palette[i % palette.length]
    }

    return signals
  }, [currentBrowserSignal, exampleSignals])

  const chartLines = React.useMemo(() => {
    // Lines of the same browsers look the same, therefore they can be skipped to improve the performance
    let isChromeEnabled = false
    let isSafariEnabled = false
    let isFirefoxEnabled = false

    return allSignals.map(({ key, title, ...signal }) => {
      const enabled = enabledSignals.includes(key)
      let draw = enabled
      if (draw) {
        if (key.includes('chrome')) {
          if (isChromeEnabled) {
            draw = false
          } else {
            isChromeEnabled = true
          }
        } else if (key.includes('safari')) {
          if (isSafariEnabled) {
            draw = false
          } else {
            isSafariEnabled = true
          }
        } else if (key.includes('firefox')) {
          if (isFirefoxEnabled) {
            draw = false
          } else {
            isFirefoxEnabled = true
          }
        }
      }

      return { ...signal, name: title, draw, showInPopup: enabled }
    })
  }, [allSignals, enabledSignals])

  const buttons = React.useMemo(
    () =>
      allSignals.map(({ key, color, title }) => ({
        key,
        value: key,
        color: numberColorToRGBA(color),
        text: title,
      })),
    [allSignals],
  )

  return (
    <Layout
      content={<Chart lines={chartLines} actualFirstIndex={4000} />}
      controls={<ToggleButtonGroup buttons={buttons} on={enabledSignals} onSwitch={setEnabledSignals} />}
    />
  )
}
