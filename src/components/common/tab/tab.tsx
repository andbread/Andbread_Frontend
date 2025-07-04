'use client'

import classNames from 'classnames'

interface TabProps {
  size: 'small' | 'medium' | 'large'
  content: string
  isClicked?: boolean
  onClick: () => void
  colorScheme: 'primary' | 'secondary'
}

const getColorSchemeClass = (
  scheme: 'primary' | 'secondary',
  isClicked: boolean,
) => {
  const classes = {
    primary: {
      selected: 'bg-primary-100 text-primary-500',
      unselected: 'bg-gray-200 text-gray-400',
    },
    secondary: {
      selected: 'bg-secondary-100 text-white',
      unselected: 'bg-gray-200 text-gray-500 text-body02',
    },
  }

  const selectedKey = isClicked ? 'selected' : 'unselected'
  return classes[scheme]?.[selectedKey] ?? ''
}

const Tab = ({ content, size, isClicked, onClick, colorScheme }: TabProps) => {
  return (
    <div
      className={classNames(
        'badge',
        getColorSchemeClass(colorScheme, isClicked!),
        {
          'badge-small': size === 'small',
          'badge-medium': size === 'medium',
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
