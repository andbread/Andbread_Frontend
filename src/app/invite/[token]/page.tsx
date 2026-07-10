import InvitePageClient from '@/components/invite/InvitePageClient'
import { NO_INDEX_METADATA } from '@/lib/seo'

export const metadata = NO_INDEX_METADATA

interface InvitePageProps {
  params: Promise<{ token: string }>
}

const InvitePage = async ({ params }: InvitePageProps) => {
  const { token } = await params

  return <InvitePageClient token={token} />
}

export default InvitePage
