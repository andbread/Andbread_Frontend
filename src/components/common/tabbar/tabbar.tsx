'use client'

import { useState } from 'react'
import Tab from '../tab/tab'

interface TabbarProps {
  tabs: string[]
  initialValue?: number
  onTabChange: (index: number) => void
}

const Tabbar = ({ tabs, initialValue, onTabChange }: TabbarProps) => {
  const [selectedTab, setSelectedTab] = useState<number>(initialValue || 0)

  const handleTabChange = (index: number) => {
    setSelectedTab(index)
    onTabChange(index)
  }

  return (
    <div className="flex flex-row gap-4">
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          isClicked={selectedTab === index}
          content={tab}
          size="small"
          onClick={() => handleTabChange(index)}
        />
      ))}
    </div>
  )
}

export default Tabbar
