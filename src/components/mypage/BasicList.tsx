import { useEffect, useState } from "react"
import ToggleButton from "../common/toggle/ToggleButton"
import { useRouter } from "next/navigation"
import useUserStore from "@/stores/useAuthStore"

const BasicList = () => {
    const [isToggle, setIsToggle] = useState(false) // 추후 유저 알림 상태를 초기 상태로 둘 예정
    const router = useRouter()
    const user = useUserStore()
    const handleToggle = () => {
        setIsToggle(!isToggle)
    }
    const handleFriendList = () => {
        router.push("/friendList")
    }
    useEffect(() => {
        console.log("user : ",user.user?.id)
    })
  return (
    <div className="card p-28">
      <ul>
        <div className="flex flex-row justify-between items-center mb-20">
          <li className="text-body02 text-gray-800">
            알림 설정
            </li>
            <div className="flex flex-row items-center">
              <span className="text-body03 text-gray-300 pr-10">{isToggle ? "알림 끄기" : "알림 켜기"}</span>
              <ToggleButton onClick={handleToggle} enabled={isToggle}/>
            </div>
          
        </div>

        <li className="cursor-pointer text-body02 text-gray-800" onClick={handleFriendList}>친구 목록</li>
      </ul>
    </div>
  )
}
export default BasicList
