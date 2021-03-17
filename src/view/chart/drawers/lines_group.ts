import { LinesList } from '../types'
import drawLine, { Options as LineOption } from './line'

interface Options extends Omit<LineOption, 'values' | 'drawFromX' | 'drawToX' | 'color' | 'opacity'> {
  linesData: LinesList
  lineOpacities: readonly number[]
  x: number
  width: number
}

export default function drawLinesGroup({
  ctx,
  linesData,
  lineOpacities,
  x,
  width,
  fromX,
  toX,
  fromIndex,
  toIndex,
  fromY,
  toY,
  fromValue,
  toValue,
  lineWidth,
}: Options): void {
  for (let key = 0; key < linesData.length; ++key) {
    drawLine({
      ctx,
      values: linesData[key].values,
      fromX,
      toX,
      fromY,
      toY,
      drawFromX: x,
      drawToX: x + width,
      fromIndex,
      toIndex,
      fromValue,
      toValue,
      color: linesData[key].color,
      lineWidth,
      opacity: lineOpacities[key],
    })
  }
}
