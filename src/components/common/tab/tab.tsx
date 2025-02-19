'use client'

import classNames from 'classnames'

interface TabProps {
  content: string
  isClicked?: boolean
  onClick: () => void
}

const Tab = ({ content, isClicked, onClick }: TabProps) => {
  return (
    <div
      className={classNames('badge', {
        'badge-selected': isClicked,
        'badge-disabled': !isClicked,
      })}
      onClick={() => {
        onClick()
      }}
    >
      {content}
    </div>
  )
}

export default Tab
