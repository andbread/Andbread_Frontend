import LoginButton from '@/components/user/LoginButton'

const LoginPage = () => {
  return (
    <div>
        <div className='w-100% h-500 flex justify-center items-center'>
            <h1>로고</h1>
        </div>
    <div className={`flex flex-col gap-8 items-center justify-center`}>
      <LoginButton provider='kakao' />
      <LoginButton provider='google' />
    </div>
    </div>
  )
}
export default LoginPage;
