import memoizeOne from 'memoize-one'

type Side = 'top' | 'right' | 'bottom' | 'left'

export default function makeFade(
  ctx: CanvasRenderingContext2D,
  side: Side,
): (x: number, y: number, width: number, height: number) => void {
  const getGradient = memoizeOne((x: number, y: number, width: number, height: number) => {
    let position: [number, number, number, number]
    switch (side) {
      case 'top':
        position = [0, y, 0, y + height]
        break
      case 'right':
        position = [x + width, 0, x, 0]
        break
      case 'bottom':
        position = [0, y + height, 0, y]
        break
      case 'left':
        position = [x, 0, x + width, 0]
        break
    }
    const gradient = ctx.createLinearGradient(...position)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,1)')
    return gradient
  })

  return (x, y, width, height) => {
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = getGradient(x, y, width, height)
    ctx.fill()
    ctx.restore()
  }
}
