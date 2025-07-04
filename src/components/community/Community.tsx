import { Post } from '@/types/post'
import PostCard from './PostCard'

const dummyPosts: Post[] = [
  {
    id: '1',
    content: 'ㅎㅇ',
    userName: '신혜민',
    userProfileImage: '',
    createdAt: '2025.07.04',
  },
  {
    id: '1',
    content: 'ㅎㅇ',
    userName: '신혜민',
    userProfileImage: '',
    createdAt: '2025.07.04',
  },
  {
    id: '1',
    content: 'ㅎㅇ',
    userName: '신혜민',
    userProfileImage: '',
    createdAt: '2025.07.04',
  },
  {
    id: '1',
    content: 'ㅎㅇ',
    userName: '신혜민',
    userProfileImage: '',
    createdAt: '2025.07.04',
  },
  {
    id: '1',
    content: 'ㅎㅇ',
    userName: '신혜민',
    userProfileImage: '',
    createdAt: '2025.07.04',
  },
]

const Community = () => {
  return (
    <div className="mb-40 flex flex-col gap-8">
      {dummyPosts.map((post, index) => (
        <PostCard key={index} postData={post}></PostCard>
      ))}
    </div>
  )
}

export default Community
