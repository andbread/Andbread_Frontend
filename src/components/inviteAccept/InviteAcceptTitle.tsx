'use client'
import { useState, useEffect } from 'react'
import { getNbread } from '@/lib/nbread'
import { getUserName } from '@/lib/auth'
const InviteAcceptTitle = () => {
  const [groupId, setGroupId] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [leaderName, setLeaderName] = useState()
  const [nbreadtitle, setNbreadTitle] = useState<string | null>(null)
  useEffect(() => {
    const fetchData = async () => {
      const url = window.location.href
      const parsedUrl = new URL(url)

      const groupId = parsedUrl.searchParams.get('groupId')
      const code = parsedUrl.searchParams.get('code')

      setGroupId(groupId)
      setCode(code)

      if (groupId) {
        const leaderIdData = await getNbread(groupId)
        setLeaderId(leaderIdData.leaderId)
        setNbreadTitle(leaderIdData.title)
        sessionStorage.setItem('group_id', groupId)
        const leaderName = await getUserName(leaderId as string)
        setLeaderName(leaderName)
      }
    }

    fetchData()
  }, [leaderId])

  return (
    <div>
      <div className="mb-20 mt-111 text-heading02">
        <span>{leaderName}</span>님이 당신을
        <br />
        <span className="text-secondary-100">{nbreadtitle}</span>으로 초대했어요
      </div>
    </div>
  )
}

export default InviteAcceptTitle
