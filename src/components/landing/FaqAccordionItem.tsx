'use client'

import { useId, useState } from 'react'
import Icon from '@/components/common/icon/Icon'

interface FaqAccordionItemProps {
  question: string
  answer: string[]
  defaultOpen?: boolean
}

const FaqAccordionItem = ({
  question,
  answer,
  defaultOpen = false,
}: FaqAccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className="shadow-card rounded-8 bg-white p-16">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-8 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <p className="break-keep text-heading04 text-gray-800">{question}</p>
        <span className="relative mt-2 block size-12 shrink-0 overflow-hidden">
          <span
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              isOpen ? '-rotate-90 opacity-0' : 'rotate-0 opacity-100'
            }`}
          >
            <Icon
              type="angleDown"
              width={12}
              height={12}
              fill="text-gray-400"
              ariaHidden
            />
          </span>
          <span
            className={`absolute inset-0 transition-all duration-300 ease-out ${
              isOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
            }`}
          >
            <Icon
              type="angleUp"
              width={12}
              height={12}
              fill="text-gray-400"
              ariaHidden
            />
          </span>
        </span>
      </button>

      <div
        id={contentId}
        className="faq-answer-panel grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-8 pt-8">
            {answer.map((paragraph) => (
              <p
                key={paragraph}
                className="break-keep text-paragraph text-gray-600"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaqAccordionItem
