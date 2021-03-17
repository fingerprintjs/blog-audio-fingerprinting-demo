import * as React from 'react'
import * as ReactDOM from 'react-dom'
import DemoSelector from './view/demo_selector'
import './view/global.css'
import './view/loading_screen/loading_screen.css' // Required for the HTML code

function start() {
  // todo: Add error boundary
  ReactDOM.render(React.createElement(DemoSelector), document.querySelector('#app'))
}

// Wait for the styles to load
if (document.readyState === 'complete') {
  start()
} else {
  addEventListener('load', start)
}
