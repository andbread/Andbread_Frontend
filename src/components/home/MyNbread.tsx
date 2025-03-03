import MyNbreadList from '@/components/home/MyNbreadList'
import { Nbread } from '@/types/nbread'
import DashlineCard from '../common/card/dashlineCard'
import { useRouter } from 'next/navigation'
interface MyNbreadProps {
  nbreadList: Nbread[]
}

const MyNbread = ({ nbreadList }: MyNbreadProps) => {
  const router = useRouter()

  return (
    <section className="mt-48">
      <div className="mb-16 flex flex-row items-end gap-12">
        <h3>나의 엔빵</h3>
        {nbreadList.length > 0 && (
          <h5 className="mb-2 text-heading05 text-secondary-200">
            {nbreadList.length}개
          </h5>
        )}
      </div>
      <DashlineCard
        text="엔빵 추가하기"
        iconType="plus"
        size={10}
        tailwindColor="text-gray-300"
        onClick={() => router.push('/nbread/create')}
      />
      <MyNbreadList nbreadList={nbreadList} />
    </section>
  )
}

export default MyNbread
