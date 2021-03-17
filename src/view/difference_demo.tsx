import * as React from 'react'
import { numberColorToRGBA } from '../utils/color'
import type { Signal } from '../example_signals'
import LoadingScreen from './loading_screen/loading_screen'
import Layout from './layout/layout'
import ToggleButtonGroup from './toggle_button/toggle_button_group'
import Chart from './chart/chart'
import { palette } from './style'

/**
 * The demo that shows differences between audio signals on different platforms
 */
export default function DifferenceDemo() {
  const exampleSignals = useExampleSignals()

  if (!exampleSignals) {
    return <LoadingScreen fullAbsolute />
  }

  return <LoadedDemo exampleSignals={exampleSignals} />
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
  exampleSignals: Record<string, Signal>
}

const LoadedDemo = React.memo<LoadedDemoProps>(function LoadedDemo({ exampleSignals }: LoadedDemoProps) {
  const [enabledSignals, setEnabledSignals] = React.useState(['chromeWindows', 'firefoxWindows', 'safariIos'])

  const statelessSignals = React.useMemo(
    () =>
      Object.entries(exampleSignals).map(([key, { title, values }], index) => ({
        key,
        title,
        color: palette[index % palette.length],
        values,
      })),
    [exampleSignals],
  )

  const chartLines = React.useMemo(
    () =>
      statelessSignals.map(({ key, title, ...signal }) => ({
        ...signal,
        name: title,
        enabled: enabledSignals.includes(key),
      })),
    [statelessSignals, enabledSignals],
  )

  const buttons = React.useMemo(
    () =>
      statelessSignals.map(({ key, color, title }) => ({
        key,
        value: key,
        color: numberColorToRGBA(color),
        text: title,
      })),
    [statelessSignals],
  )

  return (
    <Layout
      content={<Chart lines={chartLines} />}
      controls={<ToggleButtonGroup buttons={buttons} on={enabledSignals} onSwitch={setEnabledSignals} />}
    />
  )
})
