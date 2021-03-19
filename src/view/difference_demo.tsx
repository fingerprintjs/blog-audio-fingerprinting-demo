import * as React from 'react'
import { numberColorToRGBA } from '../utils/color'
import type { Signal } from '../example_signals'
import { useAudioSignal } from '../utils/audio'
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

const signalOffset = 4500

/**
 * Null means that the signal is impossible to get.
 * Undefined means that the signal is being calculated.
 */
function useCurrentBrowserSignal() {
  const signal = useAudioSignal({
    // Matches the example signals (actually they contain signal slices from 4500 to 5000)
    length: 5000,
    // Match the parameters at https://github.com/fingerprintjs/fingerprintjs/blob/9760b06109/src/sources/audio.ts
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
  })

  // Trim the signal to match the example signals
  return React.useMemo(() => signal && signal.subarray(signalOffset), [signal])
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
        title: 'Your browser',
        color: 0,
        values: currentBrowserSignal,
      })
    }

    for (let i = 0; i < signals.length; ++i) {
      signals[i].color = palette[i % palette.length]
    }

    return signals
  }, [currentBrowserSignal, exampleSignals])

  const chartLines = React.useMemo(
    () =>
      allSignals.map(({ key, title, ...signal }) => {
        const enabled = enabledSignals.includes(key)
        return { ...signal, name: title, draw: enabled, showInPopup: enabled }
      }),
    [allSignals, enabledSignals],
  )

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
      content={
        <Chart
          lines={chartLines}
          actualFirstIndex={signalOffset}
          minSelectionLength={10}
          maxSelectionLength={500}
          initialSelectionLength={53}
          detailsPopupWidth={300}
        />
      }
      controls={<ToggleButtonGroup buttons={buttons} on={enabledSignals} onSwitch={setEnabledSignals} />}
    />
  )
}
