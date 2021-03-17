import * as React from 'react'
import DifferenceDemo from './difference_demo'

/**
 * Selects the demo manually or automatically based on the page URL
 */
export default function DemoSelector() {
  // todo: Initialize from the URL
  const [selected, select] = React.useState(() => {
    if (/[&?]demo=difference($|&)/i.test(location.search)) {
      return 'difference' as const
    }
    return undefined
  })

  if (selected === 'difference') {
    return <DifferenceDemo />
  }

  return (
    <>
      {'Select a demo: '}
      <button onClick={() => select('difference')}>Signal Difference</button>
    </>
  )
}
