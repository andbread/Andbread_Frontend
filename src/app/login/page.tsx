import LoginButton from '@/components/login/LoginButton'
const LoginPage = () => {
  return (
    <div >
      <br />
      <LoginButton provider="kakao" />
      <LoginButton provider="google" />
    </div>
  )
}
export default LoginPage
