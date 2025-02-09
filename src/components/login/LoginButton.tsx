import Icon from "../common/icon/Icon";
type SocialProvider = "kakao" | "google";
interface LoginButtonProps {
    provider : SocialProvider;  
}
const providerStyles = {
    kakao : " bg-[#FEE500] hover:bg-yellow-400 text-black",
    google: "bg-[#F2F2F2]  hover:bg-gray-200 text-black shadow-lg",
}
const providerText = {
    google: "구글로 시작하기",
    kakao: "카카오로 시작하기",
  }
const LoginButton = ({provider} : LoginButtonProps) => {
   
    return (
        <button
        className={`w-[272px] h-[62px]
             py-2 rounded
              ${providerStyles[provider]}
               text-heading04
                flex justify-center items-center
                transition-all duration-300
                rounded-lg
                `}
        >
            <Icon type={provider=== "kakao" ? "kakaoLogo" : "googleLogo"} width={16} height={16}/>
            <h4 className="w-214 h-20">{providerText[provider]}</h4>
        
      </button>
    )
}
export default LoginButton;