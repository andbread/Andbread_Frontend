'use client'
import InviteAcceptButton from '@/components/inviteAccept/InviteAcceptButton'
import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import { useState, useEffect } from 'react'
import { getNbread } from '@/lib/nbread'
import { getUserName } from '@/lib/auth'
import Spinner from '@/components/common/spinner/Spinner'

const InviteAcceptPage = () => {
  const [groupId, setGroupId] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [leaderId, setLeaderId] = useState<string | null>(null)
  const [leaderName, setLeaderName] = useState()
  const [nbreadtitle, setNbreadTitle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    setIsLoading(true)
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

  useEffect(() => {
    if (nbreadtitle && leaderName) {
      setIsLoading(false)
    }
  }, [nbreadtitle, leaderName])

  if (isLoading) {
    return <Spinner isLoading={isLoading} />
  }

  return (
    <div className="flex h-full flex-col justify-between px-24">
      <div className="mb-20 mt-108 text-heading01">
        <span>{leaderName}</span>님이 당신을
        <br />
        <span className="text-secondary-100">{nbreadtitle}</span>에 초대했어요
      </div>
      <div className="mt-20 flex w-full flex-col items-center justify-center">
        <NbreadsImage isFloating={true} />
      </div>
      <InviteAcceptButton />
    </div>
  )
}
export default InviteAcceptPage
