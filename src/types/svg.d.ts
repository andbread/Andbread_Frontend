// next-env.d.ts 는 .gitignore 대상이라 새 체크아웃에는 존재하지 않는다.
// 그 파일이 참조하는 next/image-types/global 이 *.svg 선언을 제공하므로,
// tsc --noEmit 만 실행하는 CI 에서는 SVG 임포트가 전부 미해결이 된다.
// 이 프로젝트는 @svgr/webpack 으로 SVG 를 React 컴포넌트로 가져오므로
// 그 형태를 저장소에 직접 선언해 타입 체크가 next-env.d.ts 에 의존하지 않게 한다.
declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react'

  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>

  export default ReactComponent
}
