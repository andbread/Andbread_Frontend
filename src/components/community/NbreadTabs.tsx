// 'use client'

// import Avatar from '../common/avatar/avatar'
// import useUserStore from '@/stores/useAuthStore'
// import Tabbar from '../common/tabbar/tabbar'
// import CreatePostButton from './CreatePostButton'
// import { useState } from 'react'
// import NbreadDetail from '../nbread/NbreadDetail'
// const NbreadTabs = () => {
//   const { user } = useUserStore()
//   const [nbreadTab, setNbreadTab] = useState(0)

//   const nbreadTabContent = () => {
//     switch (nbreadTab) {
//       case 0:
//         return <NbreadDetail/>;
//       case 1:
//         return <div>게시판 내용</div>
//       case 2:
//         return <div>채팅방 내용</div>
//     }
//   }
//   return (
//     <>
//       <div className="mb-24">
//         <Tabbar
//           tabs={['엔빵 정보', '게시판', '채팅방']}
//           onTabChange={setNbreadTab}
//         />
//         {/* {nbreadTabContent()} */}
//         <CreatePostButton />
//       </div>
//     </>
//   )
// }

// export default NbreadTabs
