import { Post } from '@/types/post'
import PostCard from './PostCard'
import { useState } from 'react'
import CreatePostButton from './CreatePostButton'
import { getPost } from '@/lib/\bpost/getPost'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Spinner from '../common/spinner/Spinner'
const dummyPosts: Post[] = [
  // {
  //   id: '1',
  //   content: 'ㅎㅇ',
  //   userName: '신혜민',
  //   userProfileImage: '',
  //   createdAt: '2025.07.04',
  // },
  // {
  //   id: '1',
  //   content: 'ㅎㅇ',
  //   userName: '신혜민',
  //   userProfileImage: '',
  //   createdAt: '2025.07.04',
  // },
  // {
  //   id: '1',
  //   content: 'ㅎㅇ',
  //   userName: '신혜민',
  //   userProfileImage: '',
  //   createdAt: '2025.07.04',
  // },
  // {
  //   id: '1',
  //   content: 'ㅎㅇ',
  //   userName: '신혜민',
  //   userProfileImage: '',
  //   createdAt: '2025.07.04',
  // },
  // {
  //   id: '1',
  //   content: 'ㅎㅇ',
  //   userName: '신혜민',
  //   userProfileImage: '',
  //   createdAt: '2025.07.04',
  // },
]

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [hasFetched, setHasFetched] = useState<boolean>(false)
  const params = useParams()
  const nbreadId = params.nbreadId as string
  const mapToPost = (raw: any): Post => ({
    id: raw.id,
    content: raw.content,
    userName: raw.user_name,
    userProfileImage: raw.profile_image,
    createdAt: new Date(raw.created_at)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '.'),
    userId: raw.user_id,
    nbreadId: raw.nbread_id,
  })
  const fetchPosts = async () => {
    setHasFetched(false)
    const data = await getPost(nbreadId)
    const mapped = data?.map(mapToPost) ?? []
    setPosts(mapped)
    setTimeout(() => {
      setHasFetched(true)
    },1000)
  }
  useEffect(() => {
    fetchPosts()
  }, [])
  if (!hasFetched) {
    return <Spinner isLoading={true} />
  }
  return (
    <div className="mb-40 flex flex-col gap-8">
      {posts.length === 0 ? (
        <div>아직 게시글이 없습니다.</div>
      ) : (
        posts.map((post, index) => (
          <PostCard
            key={post.id}
            postData={post}
            onSuccess={fetchPosts}
          ></PostCard>
        ))
      )}
      <CreatePostButton onSuccess={fetchPosts} />
    </div>
  )
}

export default Community
