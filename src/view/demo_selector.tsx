import * as React from 'react'
import DifferenceDemo from './difference_demo'
import SignalOptionsDemo from './signal_options_demo'

const enum Demo {
  OscillatorOptions,
  DynamicsCompressorOptions,
  Difference,
}

/**
 * Selects the demo manually or automatically based on the page URL
 */
export default function DemoSelector(): React.ReactElement {
  const [selected, select] = React.useState(() => {
    const demoMatch = /[&?]demo=(.*?)($|&)/i.exec(location.search)
    switch (demoMatch?.[1]) {
      case 'oscillator-options':
        return Demo.OscillatorOptions
      case 'dynamics-compressor-options':
        return Demo.DynamicsCompressorOptions
      case 'difference':
        return Demo.Difference
      default:
        return undefined
    }
  })

  switch (selected) {
    case Demo.OscillatorOptions:
      return <SignalOptionsDemo />
    case Demo.DynamicsCompressorOptions:
      return <SignalOptionsDemo useDynamicsCompressor />
    case Demo.Difference:
      return <DifferenceDemo />
  }

  return (
    <>
      Select a demo:
      <br />
      <button onClick={() => select(Demo.OscillatorOptions)}>Oscillator Options</button>
      <br />
      <button onClick={() => select(Demo.DynamicsCompressorOptions)}>Dynamics Compressor Options</button>
      <br />
      <button onClick={() => select(Demo.Difference)}>Signal Difference</button>
    </>
  )
}
