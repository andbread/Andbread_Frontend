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
export declare global {
  interface Window {
    Kakao: any; // Kakao 객체를 any 타입으로 선언
  }
}

