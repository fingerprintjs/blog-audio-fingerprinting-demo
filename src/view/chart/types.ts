export interface Line {
  name: string
  color: number // RGB integer
  values: ArrayLike<number>
  draw: boolean
  showInPopup: boolean
}

export type LinesList = readonly Readonly<Line>[]
