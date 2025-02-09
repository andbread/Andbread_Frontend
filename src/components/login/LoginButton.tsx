type SocialProvider = "kakao" | "google";
interface LoginButtonProps {
    provider : SocialProvider;  
}
const LoginButton = ({provider} : LoginButtonProps) => {
    const providerStyles = {
        kakao : " bg-yellow-400 hover:bg-yellow-500 text-black",
        google: "bg-[#F2F2F2] hover:bg-[#FF5733] text-black",
    }
    const providerText = {
        google: "구글 로그인",
        kakao: "카카오 로그인",
      };
    return (
        <button
        className={` rounded ${providerStyles[provider]}`}
        style={{ width: "272px", height: "62px" }} 
        
      >
        {providerText[provider]}
      </button>
    )
}
export default LoginButton;