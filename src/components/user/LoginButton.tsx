'use client'
import Icon from '../common/icon/Icon'
import { login } from '@/lib/auth'
import { LoginProvider } from '@/types/user'

interface LoginButtonProps extends LoginProvider {
  next?: string
}

const providerStyles = {
  kakao: ' bg-[#FEE500] hover:bg-yellow-400 text-black',
  google:
    'bg-[#F2F2F2] hover:bg-gray-200 text-black border-2 border-solid border-[#E7E7E7]',
}
const providerText = {
  google: '구글로 시작하기',
  kakao: '카카오로 시작하기',
}
const handleLogin = async (
  provider: LoginProvider['provider'],
  next?: string,
) => {
  try {
    await login(provider, next)
  } catch (error) {
    console.error(error)
  }
}
const LoginButton = ({ provider, next }: LoginButtonProps) => {
  return (
    <button
      type="button"
      className={`h-56 w-272 rounded ${providerStyles[provider]} flex items-center justify-center rounded-8 pt-2 text-heading04 transition-all duration-300`}
      onClick={() => handleLogin(provider, next)}
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
