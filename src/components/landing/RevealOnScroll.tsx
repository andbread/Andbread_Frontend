'use client'

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

type RevealOnScrollProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
}

const RevealOnScroll = ({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  threshold = 0.18,
}: RevealOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        setIsVisible(true)
        observer.unobserve(entry.target)
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  const transitionClass = isVisible
    ? 'translate-y-0 opacity-100'
    : 'translate-y-18 opacity-0'

  return (
    <Component
      ref={ref}
      className={`reveal-on-scroll ${transitionClass} transform-gpu transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Component>
  )
}

export default RevealOnScroll
