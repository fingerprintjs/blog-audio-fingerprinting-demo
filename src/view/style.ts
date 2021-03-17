import { rgbColorToNumber } from '../utils/color'

// These styles aren't obtained immediately because the page CSS can be still loading while this script is initialized
let fontFamilyCache: string
let textColorCache: number
let backgroundColorCache: number

function populateCacheIfEmpty() {
  if (fontFamilyCache === undefined) {
    const bodyStyle = getComputedStyle(document.body)
    fontFamilyCache = bodyStyle.fontFamily

    const textColor = rgbColorToNumber(bodyStyle.color)
    if (!textColor) {
      throw new Error('Failed to parse the <body> text color')
    }
    textColorCache = textColor[0]

    const backgroundColor = rgbColorToNumber(bodyStyle.backgroundColor)
    if (!backgroundColor) {
      throw new Error('Failed to parse the <body> background color')
    }
    backgroundColorCache = backgroundColor[0]
  }
}

export function getFontFamily(): string {
  populateCacheIfEmpty()
  return fontFamilyCache
}

export function getTextColor(): number {
  populateCacheIfEmpty()
  return textColorCache
}

export function getBackgroundColor(): number {
  populateCacheIfEmpty()
  return backgroundColorCache
}

export const chartSidePadding = 12
export const chartMainTopMargin = 0
export const chartMainFadeHeight = 16
export const chartMainLinesTopMargin = 18
export const chartMainLinesBottomMargin = 35
export const chartMapHeight = 40
export const chartMapBottom = 1
export const chartMapCornerRadius = 5
export const chartMapLineWidth = 1
export const chartMapLinesHorizontalMargin = 1
export const chartMapLinesVerticalMargin = 4 / 3
export const chartSelectorOutsideColor = 0xe2eef9
export const chartSelectorOutsideOpacity = 0.6
export const chartSelectorBorderColor = 0xc0d1e1
export const chartSelectorBorderCornerRadius = 6
export const chartSelectorVerticalPadding = -1
export const chartSelectorNotchColor = 0xffffff
export const chartSelectorNotchWidth = 2
export const chartSelectorNotchHeight = 10
export const chartSelectorNotchCornerRadius = 1
export const chartMainLineWidth = 2
export const chartScaleLineColor = 0x182d3b
export const chartScaleLineOpacity = 0.1
export const chartScaleLineWidth = 1
export const chartScaleLabelColor = 0x8e8e93
export const chartScaleLabelFontSize = 11
export const chartDateScaleLabelMargin = 8
export const chartSelectorGripWidth = 10
export const chartValueScaleLabelMargin = 4
export const chartValueScaleMinSpaceForNotch = 70
export const chartValueScaleMaxNotchCount = 10
export const chartLinePointerRadius = 4

export const chartDetailsPopupXMargin = 22
export const chartDetailsPopupMinDistanceToEdge = 5
export const chartDetailsPopupY = 53
export const chartDetailsPopupWidth = 300
export const chartDetailsPopupSidePadding = 12
export const chartDetailsPopupCornerRadius = 10
export const chartDetailsPopupHeaderFontPrefix = 'Sample #'
export const chartDetailsPopupHeaderFontSize = 13
export const chartDetailsPopupHeaderFontWeight = 'bold'
export const chartDetailsPopupHeaderBaselineY = 20
export const chartDetailsPopupFirstRowBaselineY = 41
export const chartDetailsPopupRowHeight = 21
export const chartDetailsPopupBottomPadding = 13
export const chartDetailsPopupFontSize = 13
export const chartDetailsPopupFontWeight = 'regular'
export const chartDetailsPopupValueFontWeight = 'regular'
export const chartDetailsPopupBackgroundColor = 0xffffff
export const chartDetailsPopupShadowColor = 0x000000
export const chartDetailsPopupShadowOpacity = 0.2
export const chartDetailsPopupShadowXOffset = 0
export const chartDetailsPopupShadowYOffset = 1
export const chartDetailsPopupShadowBlur = 3
export const chartDetailsPopupMissingValueText = '-'

export const palette = [
  0x699ace,
  0xdf8244,
  0xa5a5a5,
  0xf6c143,
  0x4d74bf,
  0x7ea954,
  0x335e8d,
  0x944c20,
  0x636365,
  0x947424,
  0x2a4287,
  0x4b6633,
]
