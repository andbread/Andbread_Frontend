import MyNbreadList from '@/components/home/MyNbreadList'
import AddLogButton from '@/components/home/AddLogButton'
import { Nbread } from '@/types/nbread'
interface MyNbreadProps {
  nbreadList: Nbread[]
}

const MyNbread = ({ nbreadList }: MyNbreadProps) => {
  return (
    <section className="mt-40">
      <h2 className="mb-24 text-heading04 font-bold text-gray-800">
        나의 엔빵
        {nbreadList.length > 0 && (
          <span className="ml-6 text-heading05 text-secondary-200">
            {nbreadList.length}개
          </span>
        )}
      </h2>
      <AddLogButton />
      <MyNbreadList nbreadList={nbreadList} />
    </section>
  )
}

export default MyNbread
