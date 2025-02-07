declare module 'tailwindcss-preset-px-to-rem' {
  import { Plugin } from 'tailwindcss'

  const pxToRem: (options?: {
    rootValue?: number
    unitPrecision?: number
    minPixelValue?: number
    selectorBlackList?: string[]
  }) => Plugin

  export default pxToRem
}
