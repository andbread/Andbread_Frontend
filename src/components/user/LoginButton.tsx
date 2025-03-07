'use client'
import Icon from '../common/icon/Icon'
import { login } from '@/lib/auth'
import { LoginProvider } from '@/types/user'

const providerStyles = {
  kakao: ' bg-[#FEE500] hover:bg-yellow-400 text-black',
  google: 'bg-[#F2F2F2]  hover:bg-gray-200 text-black shadow-lg',
}
const providerText = {
  google: '구글로 시작하기',
  kakao: '카카오로 시작하기',
}
const handleLogin = async (provider: LoginProvider['provider']) => {
  try {
    await login(provider)
  } catch (error) {
    console.error(error)
  }
}
const LoginButton = ({ provider }: LoginProvider) => {
  return (
    <button
      className={`h-[62px] w-[272px] rounded py-2 ${providerStyles[provider]} flex items-center justify-center rounded-lg text-heading04 transition-all duration-300`}
      onClick={() => handleLogin(provider)}
    >
      <Icon
        type={provider === 'kakao' ? 'kakaoLogo' : 'googleLogo'}
        width={16}
        height={16}
      />
      <h4 className="h-20 w-214">{providerText[provider]}</h4>
    </button>
  )
}
export default LoginButton
