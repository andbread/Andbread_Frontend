import InviteAcceptTitle from '@/components/inviteAccept/InviteAcceptTitle'
import InviteAcceptButton from '@/components/inviteAccept/InviteAcceptButton'
import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'

const InviteAcceptPage = () => {
  return (
    <div className="flex h-full flex-col justify-between px-24">
      <InviteAcceptTitle />
      <div className="mt-20 flex w-full flex-col items-center justify-center">
        <NbreadsImage isFloating={true} />
      </div>
      <InviteAcceptButton />
    </div>
  )
}
export default InviteAcceptPage
