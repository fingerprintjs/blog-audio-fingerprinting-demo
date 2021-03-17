declare module '*.css' {
  const classes: { [key: string]: string }
  export = classes
}

interface Window {
  webkitOfflineAudioContext?: OfflineAudioContext
}
