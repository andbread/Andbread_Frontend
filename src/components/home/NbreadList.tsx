import NbreadCard from '@/components/home/NbreadCard'
import { Nbread } from '@/types/nbread'

interface NbreadListProps {
  nbreadList: Nbread[]
}

const NbreadList = ({ nbreadList }: NbreadListProps) => {
  return (
    <div className="flex flex-col gap-6">
      {nbreadList.map((nbread, index) => (
        <NbreadCard key={index} nbread={nbread} />
      ))}
    </div>
  )
}

export default NbreadList
