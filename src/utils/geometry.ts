export function isInRectangle(
  targetX: number,
  targetY: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
): boolean {
  return targetX >= rectX && targetX < rectX + rectWidth && targetY >= rectY && targetY < rectY + rectHeight
}

export function isInCircle(
  targetX: number,
  targetY: number,
  circleCenterX: number,
  circleCenterY: number,
  circleRadius: number,
): boolean {
  return (targetX - circleCenterX) ** 2 + (targetY - circleCenterY) ** 2 <= circleRadius ** 2
}
