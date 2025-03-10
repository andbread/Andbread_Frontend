'use client'
import Icon, { IconType } from '../icon/Icon'

import { useEffect, useState } from 'react'
import { getNbread } from '@/lib/nbread'

interface DashlineCardProps {
  text: string
  tailwindColor: string
  iconType: IconType
  size: number
  nbreadId: string
  onClick?: () => void
}

const DashlineCard = ({
  text,
  tailwindColor,
  iconType,
  size,
  onClick,
}: DashlineCardProps) => {
  return (
    <div
      className="card-dashline mb-1 flex flex-row items-center justify-center gap-8 px-32 py-26"
      onClick={onClick}
    >
      <Icon type={iconType} width={size} height={size} fill={tailwindColor} />
      <div className="text-body02">{text}</div>
    </div>
  )
}

export default DashlineCard
