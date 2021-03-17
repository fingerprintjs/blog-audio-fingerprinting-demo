import { LinesList } from '../types'
import drawLine, { Options as LineOption } from './line'

interface Options extends Omit<LineOption, 'values' | 'drawFromX' | 'drawToX' | 'color' | 'opacity'> {
  linesData: LinesList
  lineOpacities: readonly number[]
  x: number
  width: number
}

export default function drawLinesGroup({ linesData, lineOpacities, x, width, ...options }: Options): void {
  // Render the lines in backward order so that the first line is rendered on top
  for (let key = linesData.length - 1; key >= 0; --key) {
    drawLine({
      ...options,
      values: linesData[key].values,
      drawFromX: x,
      drawToX: x + width,
      color: linesData[key].color,
      opacity: lineOpacities[key],
    })
  }
}
