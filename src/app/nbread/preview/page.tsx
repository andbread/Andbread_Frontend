'use client'

import DetailHeader from '@/components/common/header/detailHeader'
import DashlineCard from '@/components/common/card/dashlineCard'
import NbreadCard from '@/components/nbread/nbreadCard'
import NbreadParticipantCard from '@/components/nbread/nbreadParticipantCard'
import useNbreadStore from '@/stores/useNbreadStore'
import { Nbread } from '@/types/nbread'

const Page = () => {
  const nbreadData = useNbreadStore((state) => state.nbread)

  return (
    <main className="h-full-y-auto relative p-24">
      <section className="stick">
        <DetailHeader />
        <div className="pt-20 text-body03 text-gray-400">
          작성한 엔빵의 미리보기에요.
        </div>
        <h2 className="pb-12 pt-4">{nbreadData?.title}</h2>
        <NbreadCard nbreadData={nbreadData as Nbread} />
        <div className="mb-12 mt-40 text-body02 text-gray-500">참여한 사람</div>
        <div className="mb-40 flex flex-col gap-8">
          {/* TODO 로그인 기능 구현 후 데이터 수정 필요 */}
          <NbreadParticipantCard isNbreadLeader={true} name={'신혜민'} />
          <DashlineCard
            text="친구는 엔빵을 만든 후 초대할 수 있어요."
            iconType="warning"
            size={12}
            tailwindColor="text-gray-00"
          />
        </div>
        <button
          className="btn btn-large btn-primary mb-20"
          onClick={() => null}
        >
          엔빵 만들기 🍞
        </button>
      </section>
    </main>
  )
}
export default Page
