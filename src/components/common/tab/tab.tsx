'use client'

import classNames from 'classnames'

interface TabProps {
  size: 'small' | 'large'
  content: string
  isClicked?: boolean
  onClick: () => void
}

const Tab = ({ content, size, isClicked, onClick }: TabProps) => {
  return (
    <div
      className={classNames(
        'badge',
        {
          'badge-selected': isClicked,
          'badge-disabled': !isClicked,
        },
        {
          'badge-small': size === 'small',
          'badge-large': size === 'large',
        },
      )}
      onClick={() => {
        onClick()
      }}
    >
      {content}
    </div>
  )
}

export default Tab
