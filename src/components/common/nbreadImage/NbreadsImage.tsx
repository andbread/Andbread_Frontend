import React from 'react'
import Nbreads from '@/assets/nbreads.svg'
import classNames from 'classnames'

interface NbreadImageProps {
  isFloating?: boolean
}

const NbreadsImage = ({ isFloating = false }: NbreadImageProps) => {
  return (
    <div className={classNames({ floating: isFloating })}>
      <Nbreads />
    </div>
  )
}

export default NbreadsImage
