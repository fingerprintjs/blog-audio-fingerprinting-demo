/**
 * Converts an integer representation of an RGB color to a CSS color string.
 * For example, 0x123456 to rgba(18,52,86,1)
 */
export function numberColorToRGBA(color: number, opacity = 1): string {
  return `rgba(${(color >> 16) % 0x100},${(color >> 8) % 0x100},${color % 0x100},${opacity})`
}

/**
 * Opposite to `numberColorToRGBA`
 */
export function rgbColorToNumber(color: string): [number, number] | undefined {
  const match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color)
  if (!match) {
    return undefined
  }
  return [(+match[1] << 16) | (+match[2] << 8) | +match[3], match[4] ? +match[4] : 1]
}
