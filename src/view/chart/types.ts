export interface Line {
  name: string
  color: number // RGB integer
  values: ArrayLike<number>
  enabled: boolean
}

export type LinesList = readonly Readonly<Line>[]
