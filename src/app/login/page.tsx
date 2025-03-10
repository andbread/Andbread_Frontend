import NbreadsImage from '@/components/common/nbreadImage/NbreadsImage'
import LoginButton from '@/components/user/LoginButton'
import NbreadText from '@/assets/logo/nbread-text.svg'

const LoginPage = () => {
  return (
    <div className="flex h-svh w-full flex-col items-center justify-around">
      <div className="w-100% mt-80 flex flex-col items-center gap-16">
        <NbreadsImage />
        <NbreadText />
        <h3 className="text-secondary-100">구독 공유 관리 서비스</h3>
      </div>
      <div className={`mb-80 flex flex-col items-center justify-center gap-8`}>
        <LoginButton provider="kakao" />
        <LoginButton provider="google" />
      </div>
    </div>
  )
}
export default LoginPage
